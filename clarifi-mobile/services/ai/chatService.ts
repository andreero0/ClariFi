// services/ai/chatService.ts

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  // Add other relevant fields e.g. context, suggestions
}

export interface AIServiceContext {
  // Basic user context to make AI responses more relevant
  cardCount?: number;
  avgSpending?: number;
  currentScreen?: string; // To provide contextual help
}

const FAQ_CACHE: Record<string, string> = {
  'what is credit utilization':
    "Credit utilization is the ratio of your credit card balance to your credit limit, expressed as a percentage. It's good to keep it low, ideally under 30%.",
  'how to build credit in canada':
    "To build credit in Canada, get a credit card, use it responsibly by making small purchases and paying the bill on time and in full. Also, consider a secured credit card or credit builder loan if you're new.",
  'what are common canadian banks':
    'Some common Canadian banks include RBC, TD, Scotiabank, BMO, and CIBC.',
};

const AI_QUERY_LIMIT = 5; // Per month for MVP
let aiQueryCount = 0;

/**
 * Placeholder for AI-powered Q&A service.
 * (MVP Feature 8: AI-Powered Q&A - Cost-Capped)
 *
 * This service would:
 * 1. First check a local FAQ database.
 * 2. If not found, check a remote cache (e.g., Redis).
 * 3. If still not found and within usage limits, call an LLM (Claude Haiku).
 * 4. Cache the LLM response.
 */
export const getAIChatResponse = async (
  userMessage: ChatMessage,
  context?: AIServiceContext
): Promise<ChatMessage> => {
  console.log(
    '[AI Chat Service] Received query:',
    userMessage.text,
    'Context:',
    context
  );

  const lowerCaseQuery = userMessage.text.toLowerCase();

  // 1. Check Local FAQ (Simplified)
  for (const key in FAQ_CACHE) {
    if (lowerCaseQuery.includes(key)) {
      return {
        id: Date.now().toString(),
        text: FAQ_CACHE[key],
        sender: 'ai',
        timestamp: Date.now(),
      };
    }
  }

  // 2. Check Remote Cache (Simulated - always miss for now)
  // 3. Call LLM if under limit (Simulated)
  if (aiQueryCount < AI_QUERY_LIMIT) {
    aiQueryCount++;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
      id: Date.now().toString(),
      text: `AI Response (Query ${aiQueryCount}/${AI_QUERY_LIMIT}): I'm processing "${userMessage.text}". For a real answer, I'd consult my LLM knowledge base. Key context: ${context?.currentScreen ? context.currentScreen : 'general'}.`,
      sender: 'ai',
      timestamp: Date.now(),
    };
  } else {
    return {
      id: Date.now().toString(),
      text: `You have reached your monthly AI query limit (${AI_QUERY_LIMIT}). Please try again next month or check our FAQ. `,
      sender: 'ai',
      timestamp: Date.now(),
    };
  }
};

export const getAIQueryUsage = () => {
  return { count: aiQueryCount, limit: AI_QUERY_LIMIT };
};
