export class TransactionForCategorizationDto {
  id: string; // original transaction ID
  description: string;
  amount: number;
  date: string; // ISO date string
  merchantId?: string | null;
} 