import { ApiProperty } from '@nestjs/swagger';

export enum TicketStatus {
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in-review', 
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class SupportTicketResponseDto {
  @ApiProperty({ description: 'Generated ticket ID' })
  ticketId: string;

  @ApiProperty({ description: 'Current ticket status', enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ description: 'Estimated response time' })
  estimatedResponseTime: string;

  @ApiProperty({ description: 'Ticket creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Support ticket priority number (higher = more urgent)' })
  priority: number;

  @ApiProperty({ description: 'Support email address for follow-up' })
  supportEmail: string;
}

export class SupportTicketStatusDto {
  @ApiProperty({ description: 'Ticket ID' })
  id: string;

  @ApiProperty({ description: 'Current status', enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Resolution details if resolved', required: false })
  resolution?: string;
} 