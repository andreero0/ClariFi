import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportTicketDto, SupportSeverity, SupportCategory } from './dto/create-support-ticket.dto';
import { SupportTicketResponseDto, TicketStatus } from './dto/support-ticket-response.dto';
import * as crypto from 'crypto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private transporter: Transporter;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter(): void {
    const smtpConfig = this.configService.get('email.smtp');
    
    if (!smtpConfig?.auth?.user || !smtpConfig?.auth?.pass) {
      this.logger.warn('Email configuration incomplete. Support tickets will be stored but not emailed.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(smtpConfig);
      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  async createSupportTicket(
    ticketData: CreateSupportTicketDto,
    attachments: Express.Multer.File[] = [],
  ): Promise<SupportTicketResponseDto> {
    try {
      const ticketId = this.generateTicketId();
      const priority = this.calculatePriority(ticketData.severity, ticketData.category);
      const estimatedResponseTime = this.getEstimatedResponseTime(ticketData.severity, ticketData.category);

      // Store ticket in database (if using Prisma/Supabase)
      await this.storeSupportTicket(ticketId, ticketData, attachments);

      // Send email notification to support team
      if (this.transporter) {
        await this.sendSupportNotificationEmail(ticketId, ticketData, attachments);
      }

      // Send confirmation email to user
      if (this.transporter) {
        await this.sendUserConfirmationEmail(ticketId, ticketData);
      }

      const response: SupportTicketResponseDto = {
        ticketId,
        status: TicketStatus.SUBMITTED,
        estimatedResponseTime,
        createdAt: new Date(),
        priority,
        supportEmail: this.configService.get('email.support.to') || 'support@clarifi.ca',
      };

      this.logger.log(`Support ticket created: ${ticketId} for ${ticketData.userEmail}`);
      return response;

    } catch (error) {
      this.logger.error('Failed to create support ticket:', error);
      throw new InternalServerErrorException('Failed to create support ticket');
    }
  }

  private generateTicketId(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  private calculatePriority(severity: SupportSeverity, category: SupportCategory): number {
    const severityWeight = {
      [SupportSeverity.URGENT]: 100,
      [SupportSeverity.HIGH]: 75,
      [SupportSeverity.MEDIUM]: 50,
      [SupportSeverity.LOW]: 25,
    };

    const categoryWeight = {
      [SupportCategory.PRIVACY_DATA]: 20,
      [SupportCategory.BILLING_SUBSCRIPTIONS]: 15,
      [SupportCategory.TECHNICAL_PROBLEMS]: 10,
      [SupportCategory.ACCOUNT_LOGIN]: 10,
      [SupportCategory.TRANSACTION_ISSUES]: 5,
      [SupportCategory.CREDIT_CARD_MANAGEMENT]: 5,
      [SupportCategory.FEATURE_REQUESTS]: 1,
      [SupportCategory.OTHER]: 1,
    };

    return severityWeight[severity] + categoryWeight[category];
  }

  private getEstimatedResponseTime(severity: SupportSeverity, category: SupportCategory): string {
    const responseMatrix: Record<SupportSeverity, Record<string, string>> = {
      [SupportSeverity.URGENT]: {
        [SupportCategory.BILLING_SUBSCRIPTIONS]: '1 hour',
        [SupportCategory.PRIVACY_DATA]: '1-2 hours',
        [SupportCategory.TECHNICAL_PROBLEMS]: '2-4 hours',
        default: '2-4 hours',
      },
      [SupportSeverity.HIGH]: {
        [SupportCategory.TECHNICAL_PROBLEMS]: '2-6 hours',
        [SupportCategory.PRIVACY_DATA]: '1-2 hours',
        [SupportCategory.ACCOUNT_LOGIN]: '2-4 hours',
        default: '4-8 hours',
      },
      [SupportSeverity.MEDIUM]: {
        [SupportCategory.ACCOUNT_LOGIN]: '2-4 hours',
        [SupportCategory.TRANSACTION_ISSUES]: '4-8 hours',
        default: '4-8 hours',
      },
      [SupportSeverity.LOW]: {
        [SupportCategory.CREDIT_CARD_MANAGEMENT]: '8-12 hours',
        [SupportCategory.FEATURE_REQUESTS]: '1-3 days',
        default: '8-12 hours',
      },
    };

    return responseMatrix[severity]?.[category] || responseMatrix[severity]?.default || '4-8 hours';
  }

  private async storeSupportTicket(
    ticketId: string,
    ticketData: CreateSupportTicketDto,
    attachments: Express.Multer.File[],
  ): Promise<void> {
    // This would integrate with your actual database
    // For now, we'll log the ticket details
    this.logger.log(`Storing support ticket ${ticketId}:`, {
      category: ticketData.category,
      severity: ticketData.severity,
      userEmail: ticketData.userEmail,
      attachmentCount: attachments.length,
    });

    // TODO: Implement actual database storage using Prisma/Supabase
    // Example:
    // await this.prismaService.supportTicket.create({
    //   data: {
    //     id: ticketId,
    //     category: ticketData.category,
    //     severity: ticketData.severity,
    //     subject: ticketData.subject,
    //     description: ticketData.description,
    //     userEmail: ticketData.userEmail,
    //     deviceInfo: ticketData.deviceInfo,
    //     status: TicketStatus.SUBMITTED,
    //     attachments: attachments.map(file => ({
    //       filename: file.originalname,
    //       size: file.size,
    //       mimetype: file.mimetype,
    //     })),
    //   },
    // });
  }

  private async sendSupportNotificationEmail(
    ticketId: string,
    ticketData: CreateSupportTicketDto,
    attachments: Express.Multer.File[],
  ): Promise<void> {
    try {
      const supportEmail = this.configService.get('email.support.to');
      const fromConfig = this.configService.get('email.from');

      const emailContent = this.generateSupportEmailContent(ticketId, ticketData, attachments);

      await this.transporter.sendMail({
        from: `${fromConfig.name} <${fromConfig.address}>`,
        to: supportEmail,
        subject: `[${ticketData.severity.toUpperCase()}] Support Ticket ${ticketId}: ${ticketData.subject}`,
        html: emailContent,
        attachments: attachments.map(file => ({
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype,
        })),
      });

      this.logger.log(`Support notification email sent for ticket ${ticketId}`);
    } catch (error) {
      this.logger.error('Failed to send support notification email:', error);
    }
  }

  private async sendUserConfirmationEmail(
    ticketId: string,
    ticketData: CreateSupportTicketDto,
  ): Promise<void> {
    try {
      const fromConfig = this.configService.get('email.from');
      const estimatedTime = this.getEstimatedResponseTime(ticketData.severity, ticketData.category);

      const emailContent = this.generateUserConfirmationEmailContent(ticketId, ticketData, estimatedTime);

      await this.transporter.sendMail({
        from: `${fromConfig.name} <${fromConfig.address}>`,
        to: ticketData.userEmail,
        subject: `Support Ticket Received - ${ticketId}`,
        html: emailContent,
      });

      this.logger.log(`User confirmation email sent for ticket ${ticketId}`);
    } catch (error) {
      this.logger.error('Failed to send user confirmation email:', error);
    }
  }

  private generateSupportEmailContent(
    ticketId: string,
    ticketData: CreateSupportTicketDto,
    attachments: Express.Multer.File[],
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Support Ticket: ${ticketId}</h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket Details</h3>
          <p><strong>Category:</strong> ${ticketData.category}</p>
          <p><strong>Severity:</strong> <span style="color: ${this.getSeverityColor(ticketData.severity)}; font-weight: bold;">${ticketData.severity.toUpperCase()}</span></p>
          <p><strong>Subject:</strong> ${ticketData.subject}</p>
          <p><strong>User Email:</strong> ${ticketData.userEmail}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
          <h3>Description</h3>
          <p style="white-space: pre-wrap;">${ticketData.description}</p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Device Information</h3>
          <p><strong>Platform:</strong> ${ticketData.deviceInfo.platform}</p>
          <p><strong>OS Version:</strong> ${ticketData.deviceInfo.version}</p>
          <p><strong>Device Model:</strong> ${ticketData.deviceInfo.model}</p>
          <p><strong>App Version:</strong> ${ticketData.deviceInfo.appVersion}</p>
        </div>

        ${attachments.length > 0 ? `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Attachments</h3>
            <ul>
              ${attachments.map(file => `<li>${file.originalname} (${this.formatFileSize(file.size)})</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          <p>This ticket was generated automatically by the ClariFi support system.</p>
        </div>
      </div>
    `;
  }

  private generateUserConfirmationEmailContent(
    ticketId: string,
    ticketData: CreateSupportTicketDto,
    estimatedTime: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Support Ticket Received</h2>
        
        <p>Dear ClariFi user,</p>
        
        <p>Thank you for contacting ClariFi support. We have received your support ticket and will respond as soon as possible.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Ticket Details</h3>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>Subject:</strong> ${ticketData.subject}</p>
          <p><strong>Category:</strong> ${ticketData.category}</p>
          <p><strong>Priority:</strong> ${ticketData.severity}</p>
          <p><strong>Estimated Response Time:</strong> ${estimatedTime}</p>
        </div>

        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What's Next?</h3>
          <ul>
            <li>Our support team will review your ticket</li>
            <li>You will receive an email response within the estimated timeframe</li>
            <li>Please reply to this email if you need to add more information</li>
          </ul>
        </div>
        
        <p>If this is an urgent issue, please contact us directly at support@clarifi.ca.</p>
        
        <p>Best regards,<br>The ClariFi Support Team</p>
        
        <div style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          <p>Please do not reply to this automated message. Use ticket ID ${ticketId} for all correspondence.</p>
        </div>
      </div>
    `;
  }

  private getSeverityColor(severity: SupportSeverity): string {
    const colors = {
      [SupportSeverity.URGENT]: '#dc2626',
      [SupportSeverity.HIGH]: '#ea580c',
      [SupportSeverity.MEDIUM]: '#d97706',
      [SupportSeverity.LOW]: '#059669',
    };
    return colors[severity] || '#6b7280';
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, resolution?: string): Promise<void> {
    // TODO: Implement ticket status update
    this.logger.log(`Updating ticket ${ticketId} status to ${status}`);
  }

  async getTicket(ticketId: string): Promise<any> {
    // TODO: Implement ticket retrieval
    this.logger.log(`Retrieving ticket ${ticketId}`);
    return null;
  }
} 