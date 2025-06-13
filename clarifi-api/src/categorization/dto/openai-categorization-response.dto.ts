// DTO for structuring responses from the OpenAI API for categorization
// This is an example structure and might need adjustment based on the OpenAI API version

interface OpenAIChoice {
  index?: number;
  message: {
    role: 'assistant';
    content: string; // This will typically contain the categorized output, possibly as JSON string
  };
  finish_reason?: string; // e.g., 'stop', 'length'
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export class OpenAICategorizationResponseDto {
  id: string; // ID of the completion
  object: string; // e.g., 'chat.completion'
  created: number; // Timestamp
  model: string; // Model used
  choices: OpenAIChoice[];
  usage?: OpenAIUsage;
  // Add other fields from OpenAI response as needed
} 