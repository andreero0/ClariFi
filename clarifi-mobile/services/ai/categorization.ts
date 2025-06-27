// services/ai/categorization.ts

export interface TransactionToCategorize {
  description: string;
  amount: number;
  date?: string; // ISO date string
  merchant_name?: string;
}

export interface CategorizationResult {
  category_id: string;
  category_name: string;
  merchant_id?: string;
  merchant_name?: string;
  confidence: number; // 0 to 1
  is_recurring_suggestion?: boolean;
}

/**
 * Placeholder for AI-powered transaction categorization.
 * (MVP Feature 2: AI-Powered Data Extraction & Categorization)
 *
 * In a real implementation, this would:
 * 1. Check a local/merchant cache.
 * 2. If cache miss, call an LLM (e.g., Claude Haiku) with optimized prompts.
 * 3. Update cache with new categorizations.
 * 4. Handle user corrections to improve the model/cache.
 */
export const categorizeTransactions = async (
  transactions: TransactionToCategorize[]
): Promise<CategorizationResult[]> => {
  console.log('[AI Service] Categorizing transactions:', transactions.length);

  // Simulate API call and processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return transactions.map(t => ({
    category_id: 'cat_groceries', // Placeholder
    category_name: 'Groceries', // Placeholder
    merchant_name: t.merchant_name || 'Unknown Merchant',
    confidence: 0.75, // Placeholder confidence
    is_recurring_suggestion: Math.random() > 0.8, // Randomly suggest recurring
  }));
};

/**
 * Placeholder for updating categorization based on user feedback.
 */
export const recordCategorizationCorrection = async (
  transactionId: string,
  correctedCategoryId: string,
  correctedMerchantName?: string
) => {
  console.log(
    '[AI Service] Correction received for txn:',
    transactionId,
    correctedCategoryId,
    correctedMerchantName
  );
  // In a real app, this would update the merchant cache and potentially a feedback loop to an ML model.
  return { success: true, message: 'Categorization feedback recorded.' };
};
