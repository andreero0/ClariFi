export class CategorizedTransactionDto {
  id: string; // original transaction ID
  category: string;
  subCategory?: string;
  confidence?: number;
  rawApiResponse?: any; // For debugging or logging, can be more specific later
} 