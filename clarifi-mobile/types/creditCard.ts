export interface CreditCard {
  id: string;
  name: string;
  lastFourDigits: string;
  issuer: CreditCardIssuer;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  paymentDueDate: string; // ISO date string
  statementDate: string; // ISO date string
  interestRate: number; // Annual percentage rate
  minimumPayment: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  color?: string; // For visual identification
}

export interface CreditCardPayment {
  id: string;
  cardId: string;
  amount: number;
  paymentDate: string; // ISO date string
  type: PaymentType;
  description?: string;
  confirmationNumber?: string;
  createdAt: string;
}

export interface CreditCardSummaryData {
  totalCreditLimit: number;
  totalCurrentBalance: number;
  totalAvailableCredit: number;
  averageUtilization: number;
  totalUtilization: number;
  cardCount: number;
  upcomingPayments: number;
  overUtilizedCards: number;
}

export interface UtilizationData {
  cardId: string;
  cardName: string;
  utilization: number;
  status: UtilizationStatus;
  recommendation?: string;
}

export type CreditCardIssuer =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'rbc'
  | 'td'
  | 'bmo'
  | 'scotiabank'
  | 'cibc'
  | 'tangerine'
  | 'mbna'
  | 'capital-one'
  | 'pc-financial'
  | 'other';

export type PaymentType =
  | 'minimum'
  | 'statement-balance'
  | 'full-balance'
  | 'custom'
  | 'automatic';

export type UtilizationStatus =
  | 'excellent' // 0-10%
  | 'good' // 11-30%
  | 'fair' // 31-50%
  | 'poor' // 51-80%
  | 'critical'; // 81-100%

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'upcoming';

export interface CreditCardFormData {
  name: string;
  lastFourDigits: string;
  issuer: CreditCardIssuer;
  creditLimit: string;
  currentBalance: string;
  paymentDueDate: string;
  statementDate: string;
  interestRate: string;
  notes?: string;
  color?: string;
}

export interface PaymentFormData {
  amount: string;
  paymentDate: string;
  type: PaymentType;
  description?: string;
  confirmationNumber?: string;
}

// Utility functions for credit card management
export const getUtilizationStatus = (
  utilization: number
): UtilizationStatus => {
  if (utilization <= 10) return 'excellent';
  if (utilization <= 30) return 'good';
  if (utilization <= 50) return 'fair';
  if (utilization <= 80) return 'poor';
  return 'critical';
};

export const getUtilizationColor = (status: UtilizationStatus): string => {
  switch (status) {
    case 'excellent':
      return '#28a745';
    case 'good':
      return '#20c997';
    case 'fair':
      return '#ffc107';
    case 'poor':
      return '#fd7e14';
    case 'critical':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid':
      return '#28a745';
    case 'pending':
      return '#ffc107';
    case 'overdue':
      return '#dc3545';
    case 'upcoming':
      return '#007bff';
    default:
      return '#6c757d';
  }
};

export const calculateDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getPaymentStatus = (
  dueDate: string,
  lastPaymentDate?: string
): PaymentStatus => {
  const daysUntilDue = calculateDaysUntilDue(dueDate);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'upcoming';
  if (lastPaymentDate) {
    const paymentDate = new Date(lastPaymentDate);
    const due = new Date(dueDate);
    if (paymentDate >= due) return 'paid';
  }
  return 'pending';
};

export const formatCreditLimit = (limit: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(limit);
};

export const calculateUtilization = (
  currentBalance: number,
  creditLimit: number
): number => {
  if (creditLimit <= 0) return 0;
  const utilization = (currentBalance / creditLimit) * 100;
  return Math.max(0, Math.min(utilization, 100));
};

export const getIssuerDisplayName = (issuer: CreditCardIssuer): string => {
  const issuerNames: Record<CreditCardIssuer, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    rbc: 'RBC Royal Bank',
    td: 'TD Canada Trust',
    bmo: 'BMO Bank of Montreal',
    scotiabank: 'Scotiabank',
    cibc: 'CIBC',
    tangerine: 'Tangerine',
    mbna: 'MBNA',
    'capital-one': 'Capital One',
    'pc-financial': 'PC Financial',
    other: 'Other',
  };

  return issuerNames[issuer] || 'Unknown';
};

export const validateCreditCardForm = (data: CreditCardFormData): string[] => {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push('Card name is required');
  }

  if (!data.lastFourDigits.trim() || data.lastFourDigits.length !== 4) {
    errors.push('Last four digits must be exactly 4 numbers');
  }

  if (!/^\d{4}$/.test(data.lastFourDigits)) {
    errors.push('Last four digits must be numbers only');
  }

  const creditLimit = parseFloat(data.creditLimit);
  if (isNaN(creditLimit) || creditLimit <= 0) {
    errors.push('Credit limit must be a positive number');
  }

  const currentBalance = parseFloat(data.currentBalance);
  if (isNaN(currentBalance) || currentBalance < 0) {
    errors.push('Current balance must be a non-negative number');
  }

  if (currentBalance > creditLimit) {
    errors.push('Current balance cannot exceed credit limit');
  }

  const interestRate = parseFloat(data.interestRate);
  if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
    errors.push('Interest rate must be between 0 and 100');
  }

  if (!data.paymentDueDate) {
    errors.push('Payment due date is required');
  }

  if (!data.statementDate) {
    errors.push('Statement date is required');
  }

  return errors;
};
