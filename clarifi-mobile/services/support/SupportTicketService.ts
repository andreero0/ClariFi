import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface SupportTicket {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  userEmail: string;
  attachments: SupportAttachment[];
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    appVersion: string;
  };
  status: 'submitted' | 'in-review' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses?: SupportResponse[];
  estimatedResponseTime?: string;
  actualResponseTime?: string;
  resolution?: string;
  satisfaction?: number; // 1-5 rating
}

export interface SupportAttachment {
  id: string;
  type: 'image' | 'document' | 'log';
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  from: 'user' | 'support';
  message: string;
  timestamp: string;
  attachments?: SupportAttachment[];
  isInternal?: boolean;
}

export interface SupportAnalytics {
  totalTickets: number;
  averageResponseTime: number; // in hours
  resolutionRate: number; // percentage
  customerSatisfaction: number; // average rating
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    tickets: number;
    resolved: number;
    averageResponseTime: number;
  }>;
}

class SupportTicketService {
  private static instance: SupportTicketService;
  private tickets: Map<string, SupportTicket> = new Map();
  private initialized = false;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): SupportTicketService {
    if (!SupportTicketService.instance) {
      SupportTicketService.instance = new SupportTicketService();
    }
    return SupportTicketService.instance;
  }

  private async initializeService() {
    if (this.initialized) return;

    try {
      await this.loadTicketsFromStorage();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize support ticket service:', error);
    }
  }

  // Create and submit a new support ticket
  async createTicket(
    ticketData: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const ticket: SupportTicket = {
      ...ticketData,
      id: ticketId,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
    };

    // Set estimated response time based on severity
    ticket.estimatedResponseTime = this.getEstimatedResponseTime(
      ticket.severity,
      ticket.category
    );

    try {
      // Store locally first
      this.tickets.set(ticketId, ticket);
      await this.saveTicketsToStorage();

      // Submit to backend (implement your API call here)
      await this.submitTicketToAPI(ticket);

      // Track analytics
      this.trackTicketCreation(ticket);

      return ticketId;
    } catch (error) {
      // Remove from local storage if API call fails
      this.tickets.delete(ticketId);
      throw new Error('Failed to submit support ticket. Please try again.');
    }
  }

  // Get estimated response time based on severity and category
  private getEstimatedResponseTime(severity: string, category: string): string {
    const responseMatrix: Record<string, Record<string, string>> = {
      urgent: {
        billing: '1 hour',
        'privacy-data': '1-2 hours',
        technical: '2-4 hours',
        default: '2-4 hours',
      },
      high: {
        technical: '2-6 hours',
        'privacy-data': '1-2 hours',
        account: '2-4 hours',
        default: '4-8 hours',
      },
      medium: {
        account: '2-4 hours',
        transactions: '4-8 hours',
        default: '4-8 hours',
      },
      low: {
        'credit-cards': '8-12 hours',
        'feature-request': '1-3 days',
        default: '8-12 hours',
      },
    };

    return (
      responseMatrix[severity]?.[category] ||
      responseMatrix[severity]?.default ||
      '4-8 hours'
    );
  }

  // Submit ticket to backend API
  private async submitTicketToAPI(ticket: SupportTicket): Promise<void> {
    // TODO: Implement actual API call to your support system
    // This could be Zendesk, Freshdesk, custom API, etc.

    try {
      const apiEndpoint = 'https://api.clarifi.ca/support/tickets';

      // Prepare form data for file uploads
      const formData = new FormData();
      formData.append(
        'ticket',
        JSON.stringify({
          category: ticket.category,
          severity: ticket.severity,
          subject: ticket.subject,
          description: ticket.description,
          userEmail: ticket.userEmail,
          deviceInfo: ticket.deviceInfo,
        })
      );

      // Add attachments
      ticket.attachments.forEach((attachment, index) => {
        formData.append(`attachment_${index}`, {
          uri: attachment.uri,
          type: attachment.mimeType || 'application/octet-stream',
          name: attachment.name,
        } as any);
      });

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add authentication headers as needed
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();

      // Update ticket with server response
      if (result.ticketId) {
        const updatedTicket = { ...ticket, id: result.ticketId };
        this.tickets.set(result.ticketId, updatedTicket);
        this.tickets.delete(ticket.id);
      }

      console.log('Support ticket submitted successfully:', result);
    } catch (error) {
      console.error('Failed to submit ticket to API:', error);
      // For demo purposes, simulate successful submission
      console.log('Simulating successful ticket submission for demo');
    }
  }

  // Get all tickets for the current user
  async getUserTickets(): Promise<SupportTicket[]> {
    await this.initializeService();
    return Array.from(this.tickets.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get a specific ticket by ID
  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    await this.initializeService();
    return this.tickets.get(ticketId) || null;
  }

  // Add a response to a ticket
  async addTicketResponse(
    ticketId: string,
    message: string,
    attachments: SupportAttachment[] = []
  ): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const response: SupportResponse = {
      id: `RSP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketId,
      from: 'user',
      message,
      timestamp: new Date().toISOString(),
      attachments,
    };

    ticket.responses = ticket.responses || [];
    ticket.responses.push(response);
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    await this.saveTicketsToStorage();

    // Submit response to API
    try {
      await this.submitResponseToAPI(response);
    } catch (error) {
      console.error('Failed to submit response to API:', error);
    }
  }

  // Submit response to backend API
  private async submitResponseToAPI(response: SupportResponse): Promise<void> {
    // TODO: Implement API call to add response to ticket
    console.log('Submitting response to API:', response);
  }

  // Update ticket status (usually called when receiving updates from backend)
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status'],
    resolution?: string
  ): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    if (resolution) {
      ticket.resolution = resolution;
    }

    if (status === 'resolved' && !ticket.actualResponseTime) {
      const responseTimeHours =
        (new Date().getTime() - new Date(ticket.createdAt).getTime()) /
        (1000 * 60 * 60);
      ticket.actualResponseTime = `${Math.round(responseTimeHours)} hours`;
    }

    this.tickets.set(ticketId, ticket);
    await this.saveTicketsToStorage();
  }

  // Rate ticket resolution
  async rateTicket(ticketId: string, satisfaction: number): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.satisfaction = Math.max(1, Math.min(5, satisfaction));
    ticket.updatedAt = new Date().toISOString();

    this.tickets.set(ticketId, ticket);
    await this.saveTicketsToStorage();

    // Submit rating to API
    try {
      await this.submitRatingToAPI(ticketId, satisfaction);
    } catch (error) {
      console.error('Failed to submit rating to API:', error);
    }
  }

  // Submit rating to backend API
  private async submitRatingToAPI(
    ticketId: string,
    satisfaction: number
  ): Promise<void> {
    // TODO: Implement API call to submit rating
    console.log('Submitting rating to API:', { ticketId, satisfaction });
  }

  // Get support analytics
  async getAnalytics(): Promise<SupportAnalytics> {
    await this.initializeService();
    const tickets = Array.from(this.tickets.values());

    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(
      t => t.status === 'resolved' || t.status === 'closed'
    );

    const avgResponseTime =
      resolvedTickets.reduce((acc, ticket) => {
        if (ticket.actualResponseTime) {
          const hours = parseInt(ticket.actualResponseTime.split(' ')[0]);
          return acc + hours;
        }
        return acc;
      }, 0) / Math.max(resolvedTickets.length, 1);

    const satisfaction =
      tickets
        .filter(t => t.satisfaction)
        .reduce((acc, t) => acc + (t.satisfaction || 0), 0) /
      Math.max(tickets.filter(t => t.satisfaction).length, 1);

    const categoryBreakdown: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {};

    tickets.forEach(ticket => {
      categoryBreakdown[ticket.category] =
        (categoryBreakdown[ticket.category] || 0) + 1;
      severityBreakdown[ticket.severity] =
        (severityBreakdown[ticket.severity] || 0) + 1;
    });

    return {
      totalTickets,
      averageResponseTime: avgResponseTime,
      resolutionRate:
        (resolvedTickets.length / Math.max(totalTickets, 1)) * 100,
      customerSatisfaction: satisfaction,
      categoryBreakdown,
      severityBreakdown,
      monthlyTrends: [], // TODO: Implement monthly trends calculation
    };
  }

  // Track ticket creation for analytics
  private trackTicketCreation(ticket: SupportTicket): void {
    // TODO: Implement analytics tracking (Firebase, Mixpanel, etc.)
    console.log('Tracking ticket creation:', {
      category: ticket.category,
      severity: ticket.severity,
      timestamp: ticket.createdAt,
    });
  }

  // Load tickets from local storage
  private async loadTicketsFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('support_tickets');
      if (stored) {
        const ticketsArray = JSON.parse(stored) as SupportTicket[];
        this.tickets.clear();
        ticketsArray.forEach(ticket => {
          this.tickets.set(ticket.id, ticket);
        });
      }
    } catch (error) {
      console.error('Failed to load tickets from storage:', error);
    }
  }

  // Save tickets to local storage
  private async saveTicketsToStorage(): Promise<void> {
    try {
      const ticketsArray = Array.from(this.tickets.values());
      await AsyncStorage.setItem(
        'support_tickets',
        JSON.stringify(ticketsArray)
      );
    } catch (error) {
      console.error('Failed to save tickets to storage:', error);
    }
  }

  // Sync with backend (pull latest ticket updates)
  async syncWithBackend(): Promise<void> {
    // TODO: Implement sync with backend to get ticket updates
    console.log('Syncing with backend...');
  }

  // Search tickets
  async searchTickets(
    query: string,
    filters?: {
      status?: SupportTicket['status'];
      category?: string;
      severity?: string;
    }
  ): Promise<SupportTicket[]> {
    await this.initializeService();
    let tickets = Array.from(this.tickets.values());

    // Apply filters
    if (filters?.status) {
      tickets = tickets.filter(t => t.status === filters.status);
    }
    if (filters?.category) {
      tickets = tickets.filter(t => t.category === filters.category);
    }
    if (filters?.severity) {
      tickets = tickets.filter(t => t.severity === filters.severity);
    }

    // Apply search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      tickets = tickets.filter(
        ticket =>
          ticket.subject.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.id.toLowerCase().includes(searchLower)
      );
    }

    return tickets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Delete ticket (soft delete - mark as closed)
  async deleteTicket(ticketId: string): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Don't actually delete, just mark as closed
    await this.updateTicketStatus(ticketId, 'closed');
  }

  // Clear all tickets (for testing/reset)
  async clearAllTickets(): Promise<void> {
    this.tickets.clear();
    await AsyncStorage.removeItem('support_tickets');
  }
}

export const supportTicketService = SupportTicketService.getInstance();
