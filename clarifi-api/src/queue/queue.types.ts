// --- Job Data Interfaces ---
export interface StatementProcessingJobData {
  statementImportId: string; // UUID of the statement_imports record
  fileKey: string; // Key to the uploaded file in Supabase Storage (or temp local path if applicable)
  userId: string;
  bankName: string;
}

export interface AiCategorizationJobData {
  userId: string;
  transactions: Array<{
    id: string; // Transaction UUID
    description: string;
    amount: number;
    date: string; // ISO date string
    // Potentially include existing merchantId if known, to aid categorization
    merchantId?: string | null;
  }>;
}
// --- End of Job Data Interfaces ---

export const STATEMENT_PROCESSING_QUEUE = 'statement-processing';
export const AI_CATEGORIZATION_QUEUE = 'ai-categorization';