/**
 * Templates for LLM prompts to ensure consistency and optimize token usage.
 * These are critical for cost control with LLMs (Feature 2 & 8).
 */

export const getCategorizationPrompt = (
  transactionDescription: string,
  merchantName?: string
): string => {
  let prompt = `Categorize this financial transaction from a Canadian bank statement. Focus on common personal finance categories (e.g., Groceries, Dining, Transport, Bills, Shopping, Entertainment, Income). Description: "${transactionDescription}"`;
  if (merchantName) {
    prompt += ` Merchant: "${merchantName}"`;
  }
  prompt += `\nCategory:`; // LLM is expected to complete this.
  return prompt;
};

export const getFinancialQueryContextualPrompt = (
  userQuery: string,
  userContext?: any
): string => {
  // userContext might include things like current screen, recent transactions, goals, etc.
  // This helps the LLM provide more relevant, personalized answers.
  let prompt = `You are ClariFi, a helpful financial assistant for users in Canada. Answer the following question concisely and clearly.`;

  if (userContext) {
    prompt += `\nUser Context (be brief if using this): ${JSON.stringify(userContext, null, 2).substring(0, 100)}...`; // Limit context size
  }

  prompt += `\n\nUser Question: "${userQuery}"\n\nAnswer:`;
  return prompt;
};

export const getStatementParsingGuidancePrompt = (ocrText: string): string => {
  // This might be used if OCR text is ambiguous and needs LLM to structure it.
  // For MVP, this might be too complex/costly.
  return `Parse the following OCR text from a bank statement into a list of transactions (Date, Description, Amount). Focus on tabular data if present. Text: \n"${ocrText.substring(0, 1000)}"... \nTransactions:`; // Limit OCR text length
};

// Add more prompt templates as needed for other AI features.
