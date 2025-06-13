import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { QACacheService, LLMCacheEntry } from './qa-cache.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

// Canadian financial context and guidelines
const CANADIAN_FINANCIAL_CONTEXT = `
You are ClariFi's AI financial advisor, specialized in Canadian personal finance.

CRITICAL GUIDELINES:
- Focus exclusively on Canadian financial advice (CAD, Canadian banks, regulations)
- Reference Canadian institutions: Big Six banks (RBC, TD, Scotiabank, BMO, CIBC, National Bank), credit unions, online banks (Tangerine, PC Financial)
- Use Canadian financial products: TFSA, RRSP, RESP, FHSA, GIC, HISA
- Reference Canadian credit bureaus: Equifax and TransUnion Canada
- Mention Canadian regulations: PIPEDA, CDIC insurance, provincial regulations
- Provide practical, actionable advice suitable for all income levels
- Keep responses concise (under 200 words) and easy to understand
- Always prioritize user privacy and financial security
`;

const RESPONSE_GUIDELINES = `
RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide 2-3 key actionable points
- Include relevant Canadian context (banks, products, regulations)
- End with encouragement or next steps
- Keep tone friendly but professional
- Use Canadian terminology and dollar amounts (CAD)

AVOID:
- Investment advice (stocks, individual securities)
- Tax advice beyond general guidance
- Legal advice
- Medical or insurance advice
- American financial products or institutions
`;

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  stream?: boolean;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface QARequest {
  query: string;
  userId: string;
  context?: string;
  maxTokens?: number;
}

export interface QAResponse {
  answer: string;
  fromCache: boolean;
  model: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  responseTime: number;
  confidence: number;
  source: 'cache' | 'llm';
}

@Injectable()
export class QALLMService {
  private readonly logger = new Logger(QALLMService.name);
  private readonly openAIApiKey: string | undefined;
  private readonly chatCompletionUrl: string;
  private readonly modelName: string;
  private readonly requestTemperature: number;
  private readonly maxTokensResponse: number;
  private readonly costPerToken: { input: number; output: number };

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: QACacheService,
  ) {
    // Load OpenAI configuration (reusing existing config patterns)
    this.openAIApiKey = this.configService.get<string>('openai.apiKey');
    this.chatCompletionUrl = this.configService.get<string>('openai.chatCompletionUrl') || 'https://api.openai.com/v1/chat/completions';
    
    // Use cost-optimized model for Q&A (cheaper than categorization model)
    this.modelName = this.configService.get<string>('qa.modelName') || 'gpt-3.5-turbo';
    this.requestTemperature = this.configService.get<number>('qa.temperature') || 0.3;
    this.maxTokensResponse = this.configService.get<number>('qa.maxTokens') || 200;
    
    // Cost tracking (approximate values for gpt-3.5-turbo)
    this.costPerToken = {
      input: 0.0015 / 1000, // $0.0015 per 1K input tokens
      output: 0.002 / 1000   // $0.002 per 1K output tokens
    };

    if (!this.openAIApiKey) {
      this.logger.warn('OPENAI_API_KEY is not configured. Q&A LLM service will not work.');
    } else {
      this.logger.log(`Q&A LLM service initialized: Model=${this.modelName}, MaxTokens=${this.maxTokensResponse}`);
    }
  }

  /**
   * Process Q&A request with caching and cost optimization
   */
  async processQuery(request: QARequest): Promise<QAResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Check cache first
      const cachedResponse = await this.cacheService.getCachedLLMResponse(request.query, request.context);
      
      if (cachedResponse) {
        return {
          answer: cachedResponse.response,
          fromCache: true,
          model: cachedResponse.model,
          tokens: cachedResponse.tokens,
          cost: 0, // No cost for cached responses
          responseTime: Date.now() - startTime,
          confidence: 0.95, // High confidence for cached responses
          source: 'cache'
        };
      }

      // 2. Generate LLM response
      const llmResponse = await this.generateLLMResponse(request);
      
      // 3. Cache the response for future use
      if (llmResponse.tokens) {
        await this.cacheService.cacheLLMResponse(
          request.query,
          llmResponse.answer,
          llmResponse.model,
          llmResponse.tokens,
          llmResponse.cost,
          request.context
        );
      }

      return {
        ...llmResponse,
        fromCache: false,
        responseTime: Date.now() - startTime,
        source: 'llm'
      };

    } catch (error) {
      this.logger.error(`Q&A processing failed for user ${request.userId}:`, error);
      throw new BadRequestException('Unable to process your question at this time. Please try again.');
    }
  }

  /**
   * Generate LLM response with Canadian financial expertise
   */
  private async generateLLMResponse(request: QARequest): Promise<Omit<QAResponse, 'fromCache' | 'responseTime' | 'source'>> {
    if (!this.openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const prompt = this.constructFinancialPrompt(request.query, request.context);
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Generating LLM response for query: "${request.query.substring(0, 50)}..."`);
      
      const response = await firstValueFrom(
        this.httpService.post<OpenAIResponse>(
          this.chatCompletionUrl,
          prompt,
          {
            headers: {
              'Authorization': `Bearer ${this.openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000, // 15 second timeout for Q&A
          }
        )
      );

      const aiResponse = response.data;
      const duration = Date.now() - startTime;
      
      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      const answer = aiResponse.choices[0].message.content.trim();
      const tokens = aiResponse.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const cost = this.calculateCost(tokens);

      // Validate response quality
      if (!answer || answer.length < 20) {
        throw new Error('Generated response is too short or empty');
      }

      this.logger.log(`LLM response generated in ${duration}ms. Cost: $${cost.toFixed(4)}, Tokens: ${tokens.total_tokens}`);

      return {
        answer,
        model: aiResponse.model || this.modelName,
        tokens: {
          input: tokens.prompt_tokens,
          output: tokens.completion_tokens,
          total: tokens.total_tokens
        },
        cost,
        confidence: this.calculateConfidence(answer, tokens.total_tokens)
      };

    } catch (error) {
      this.logger.error(`OpenAI API call failed: ${error.message}`);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed with OpenAI API');
      } else {
        throw new Error('Failed to generate response. Please try again.');
      }
    }
  }

  /**
   * Construct optimized prompt for Canadian financial Q&A
   */
  private constructFinancialPrompt(query: string, context?: string): OpenAIRequest {
    const contextMessage = context ? `\n\nAdditional Context: ${context}` : '';
    
    return {
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content: CANADIAN_FINANCIAL_CONTEXT + '\n\n' + RESPONSE_GUIDELINES
        },
        {
          role: 'user',
          content: `Canadian Financial Question: ${query}${contextMessage}`
        }
      ],
      temperature: this.requestTemperature,
      max_tokens: this.maxTokensResponse
    };
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: { prompt_tokens: number; completion_tokens: number; total_tokens: number }): number {
    const inputCost = tokens.prompt_tokens * this.costPerToken.input;
    const outputCost = tokens.completion_tokens * this.costPerToken.output;
    return inputCost + outputCost;
  }

  /**
   * Calculate confidence score based on response characteristics
   */
  private calculateConfidence(response: string, totalTokens: number): number {
    let confidence = 0.7; // Base confidence
    
    // Boost confidence for detailed responses
    if (response.length > 100) confidence += 0.1;
    if (response.length > 150) confidence += 0.1;
    
    // Boost confidence for Canadian-specific content
    const canadianTerms = ['canada', 'canadian', 'cad', 'tfsa', 'rrsp', 'rbc', 'td', 'scotiabank', 'bmo', 'cibc'];
    const foundTerms = canadianTerms.filter(term => response.toLowerCase().includes(term));
    confidence += Math.min(0.1, foundTerms.length * 0.02);
    
    // Boost confidence for structured responses
    if (response.includes('•') || response.includes('-') || response.includes('1.')) confidence += 0.05;
    
    // Penalize very short responses
    if (response.length < 50) confidence -= 0.2;
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  /**
   * Validate that the query is appropriate for financial advice
   */
  validateQuery(query: string): { isValid: boolean; reason?: string } {
    if (!query || query.trim().length < 5) {
      return { isValid: false, reason: 'Query is too short' };
    }

    if (query.length > 500) {
      return { isValid: false, reason: 'Query is too long. Please keep questions under 500 characters.' };
    }

    // Check for inappropriate content
    const inappropriatePatterns = [
      /\b(sex|porn|drug|illegal|hack|scam)\b/i,
      /\b(medical|health|doctor|diagnosis)\b/i, // Avoid medical advice
      /\b(legal|lawyer|lawsuit|sue)\b/i // Avoid legal advice
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(query)) {
        return { isValid: false, reason: 'This question is outside my area of financial expertise.' };
      }
    }

    return { isValid: true };
  }

  /**
   * Get service health and configuration info
   */
  async getServiceHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    configured: boolean;
    model: string;
    maxTokens: number;
    cacheStatus: any;
  }> {
    try {
      const cacheHealth = await this.cacheService.healthCheck();
      
      return {
        status: this.openAIApiKey ? 'healthy' : 'unhealthy',
        configured: !!this.openAIApiKey,
        model: this.modelName,
        maxTokens: this.maxTokensResponse,
        cacheStatus: cacheHealth
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        configured: false,
        model: this.modelName,
        maxTokens: this.maxTokensResponse,
        cacheStatus: { status: 'unhealthy' }
      };
    }
  }
} 