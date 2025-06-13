// DTO for structuring requests to the OpenAI API for categorization
// This is an example structure and might need adjustment based on the chosen model and prompt strategy

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAICategorizationRequestDto {
  model: string; // e.g., 'gpt-3.5-turbo'
  messages: OpenAIMessage[];
  temperature?: number; // 0.0 - 2.0, defaults to 1.0
  max_tokens?: number;
  // Add other OpenAI parameters as needed (e.g., top_p, n, stream, stop, presence_penalty, frequency_penalty)
} 