import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Logger,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketResponseDto, SupportTicketStatusDto, TicketStatus } from './dto/support-ticket-response.dto';

@ApiTags('Support')
@Controller('support')
@UseGuards(ThrottlerGuard) // Rate limiting to prevent abuse
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({
    summary: 'Create support ticket',
    description: 'Create a new support ticket with optional file attachments',
  })
  @ApiResponse({
    status: 201,
    description: 'Support ticket created successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Support ticket data with optional file attachments',
    schema: {
      type: 'object',
      properties: {
        ticket: {
          type: 'string',
          description: 'JSON string containing ticket data',
        },
        attachments: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Optional file attachments (max 5 files, 10MB each)',
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5, // Max 5 files
      },
      fileFilter: (req, file, callback) => {
        // Allow common file types
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/json',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('File type not allowed'), false);
        }
      },
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createTicket(
    @Body('ticket') ticketData: string,
    @UploadedFiles() attachments: Express.Multer.File[],
  ): Promise<SupportTicketResponseDto> {
    try {
      // Parse the ticket data JSON
      let parsedTicketData: CreateSupportTicketDto;
      try {
        parsedTicketData = JSON.parse(ticketData);
      } catch (error) {
        throw new BadRequestException('Invalid ticket data format');
      }

      // Validate the parsed data
      const validator = new ValidationPipe({ transform: true, whitelist: true });
      const validatedData = await validator.transform(parsedTicketData, {
        type: 'body',
        metatype: CreateSupportTicketDto,
      });

      this.logger.log(`Creating support ticket for user: ${validatedData.userEmail}`);
      
      const result = await this.supportService.createSupportTicket(
        validatedData,
        attachments || [],
      );

      this.logger.log(`Support ticket created successfully: ${result.ticketId}`);
      return result;
      
    } catch (error) {
      this.logger.error('Failed to create support ticket:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create support ticket');
    }
  }

  @Get('tickets/:ticketId')
  @ApiOperation({
    summary: 'Get support ticket details',
    description: 'Retrieve details for a specific support ticket',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  async getTicket(@Param('ticketId') ticketId: string) {
    this.logger.log(`Retrieving support ticket: ${ticketId}`);
    return await this.supportService.getTicket(ticketId);
  }

  @Patch('tickets/:ticketId/status')
  @ApiOperation({
    summary: 'Update ticket status',
    description: 'Update the status of a support ticket (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated successfully',
    type: SupportTicketStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Support ticket not found',
  })
  async updateTicketStatus(
    @Param('ticketId') ticketId: string,
    @Body() updateData: { status: TicketStatus; resolution?: string },
  ): Promise<SupportTicketStatusDto> {
    this.logger.log(`Updating ticket ${ticketId} status to: ${updateData.status}`);
    
    await this.supportService.updateTicketStatus(
      ticketId,
      updateData.status,
      updateData.resolution,
    );

    return {
      id: ticketId,
      status: updateData.status,
      updatedAt: new Date(),
      resolution: updateData.resolution,
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the support service is healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'Support service is healthy',
  })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'support',
    };
  }
} 