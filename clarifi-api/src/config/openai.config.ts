import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  chatCompletionUrl: process.env.OPENAI_CHAT_COMPLETION_URL || 'https://api.openai.com/v1/chat/completions',
  modelName: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
  requestTemperature: parseFloat(process.env.OPENAI_REQUEST_TEMPERATURE || '0.2'),
  maxTokensResponse: parseInt(process.env.OPENAI_MAX_TOKENS_RESPONSE || '20', 10),
})); 