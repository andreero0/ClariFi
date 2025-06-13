import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
// import { OpenAI } from 'openai'; // Uncomment if using OpenAI SDK
import { TransactionForCategorizationDto } from './dto/transaction-for-categorization.dto';
import { CategorizedTransactionDto } from './dto/categorized-transaction.dto';
import { CategorizationCacheService } from './categorization-cache.service';
import { RuleBasedCategorizationService } from './rule-based-categorization.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

// Predefined category list for Canadian financial transactions
const PREDEFINED_CATEGORIES = [
  'Groceries',
  'Transportation', 
  'Housing',
  'Utilities',
  'Dining Out',
  'Entertainment',
  'Shopping',
  'Health & Wellness',
  'Services',
  'Income',
  'Transfers',
  'Other'
] as const;

type TransactionCategory = typeof PREDEFINED_CATEGORIES[number];

interface OpenAICategorizationRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

interface OpenAICategorizationResponse {
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
}

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);
  // private openai: OpenAI; // Uncomment if using OpenAI SDK
  private readonly openAIApiKey: string | undefined;
  private readonly chatCompletionUrl: string;
  private readonly modelName: string;
  private readonly requestTemperature: number;
  private readonly maxTokensResponse: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService, // Or remove if using OpenAI SDK directly
    private readonly cacheService: CategorizationCacheService,
    private readonly ruleBasedCategorizationService: RuleBasedCategorizationService,
    private readonly performanceMonitor: PerformanceMonitorService,
  ) {
    this.openAIApiKey = this.configService.get<string>('openai.apiKey');
    this.chatCompletionUrl = this.configService.get<string>('openai.chatCompletionUrl') || 'https://api.openai.com/v1/chat/completions';
    this.modelName = this.configService.get<string>('openai.modelName') || 'gpt-3.5-turbo';
    this.requestTemperature = this.configService.get<number>('openai.requestTemperature') || 0.2;
    this.maxTokensResponse = this.configService.get<number>('openai.maxTokensResponse') || 20;

    if (!this.openAIApiKey) {
      this.logger.warn('OPENAI_API_KEY is not configured under openai.apiKey. AI-based categorization will not work.');
    } else {
      this.logger.log(`OpenAI configuration loaded: Model=${this.modelName}, Temperature=${this.requestTemperature}, MaxTokens=${this.maxTokensResponse}`);
      // Example: this.openai = new OpenAI({ apiKey: this.openAIApiKey }); // Uncomment if using OpenAI SDK
    }
  }

  private isValidISODate(dateString: string): boolean {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(dateString) && !/\d{4}-\d{2}-\d{2}/.test(dateString)) {
      // Regex for YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD
      return false;
    }
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private async preprocessTransaction(
    transaction: TransactionForCategorizationDto,
  ): Promise<TransactionForCategorizationDto | null> {
    const { id, description, amount, date } = transaction;

    // Validate ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      this.logger.error(`Invalid or missing ID for transaction: ${JSON.stringify(transaction)}`);
      return null; // Critical error, cannot proceed
    }

    // Validate Amount
    if (amount === undefined || amount === null || typeof amount !== 'number') {
      this.logger.error(`Invalid or missing amount for transaction ${id}`);
      return null; // Critical error
    }

    // Validate Date
    if (!date || typeof date !== 'string' || !this.isValidISODate(date)) {
      this.logger.error(`Invalid or missing date format for transaction ${id}. Expected ISO 8601 string.`);
      return null; // Critical error
    }
    
    // Validate and normalize Description
    if (!description || typeof description !== 'string' || description.trim() === '') {
      this.logger.warn(`Transaction ${id} has missing or empty description. Using 'N/A'.`);
      transaction.description = 'N/A'; 
    } else {
      transaction.description = description.trim().toLowerCase().replace(/\s+/g, ' ');
    }
    
    return transaction;
  }

  private constructCategorizationPrompt(transactionDescription: string): OpenAICategorizationRequest {
    const categoryList = PREDEFINED_CATEGORIES.join(', ');
    
    return {
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content: `You are an expert transaction categorization assistant for Canadian users. Given a bank transaction description, classify it into one of the following predefined categories: ${categoryList}. Respond ONLY with a JSON object in the format: {"category": "CATEGORY_NAME"}.`
        },
        {
          role: 'user',
          content: `Transaction: ${transactionDescription}`
        }
      ],
      temperature: this.requestTemperature,
      max_tokens: this.maxTokensResponse
    };
  }

  private async callOpenAIForCategorization(transactionDescription: string): Promise<string> {
    if (!this.openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const requestBody = this.constructCategorizationPrompt(transactionDescription);
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Calling OpenAI API for transaction: "${transactionDescription}"`);
      
      const response = await firstValueFrom(
        this.httpService.post<OpenAICategorizationResponse>(
          this.chatCompletionUrl,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${this.openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
          }
        )
      );

      const aiResponse = response.data;
      const duration = Date.now() - startTime;
      
      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      const messageContent = aiResponse.choices[0].message.content.trim();
      this.logger.debug(`Raw OpenAI response: ${messageContent}`);

      // Parse the JSON response
      let parsedResponse: { category: string };
      try {
        parsedResponse = JSON.parse(messageContent);
      } catch (parseError) {
        this.logger.error(`Failed to parse OpenAI JSON response: ${messageContent}`, parseError);
        throw new Error(`Invalid JSON response from OpenAI: ${messageContent}`);
      }

      if (!parsedResponse.category || typeof parsedResponse.category !== 'string') {
        throw new Error(`Invalid category in OpenAI response: ${JSON.stringify(parsedResponse)}`);
      }

      // Validate that the category is one of our predefined categories
      const categoryName = parsedResponse.category.trim();
      if (!PREDEFINED_CATEGORIES.includes(categoryName as TransactionCategory)) {
        this.logger.warn(`OpenAI returned invalid category "${categoryName}". Falling back to "Other".`);
        return 'Other';
      }

      this.logger.debug(`Successfully categorized "${transactionDescription}" as "${categoryName}"`);
      
      // Record performance metrics
      if (aiResponse.usage) {
        const cost = this.performanceMonitor.calculateApiCost(
          aiResponse.usage.prompt_tokens,
          aiResponse.usage.completion_tokens
        );

        await this.performanceMonitor.recordMetric({
          timestamp: new Date(),
          operation: 'ai_categorization',
          duration,
          success: true,
          cost,
          tokens: {
            input: aiResponse.usage.prompt_tokens,
            output: aiResponse.usage.completion_tokens,
            total: aiResponse.usage.total_tokens,
          },
        });

        this.logger.debug(`Token usage - Prompt: ${aiResponse.usage.prompt_tokens}, Completion: ${aiResponse.usage.completion_tokens}, Total: ${aiResponse.usage.total_tokens}, Cost: $${cost.toFixed(6)}`);
      } else {
        // Record metric without token usage
        await this.performanceMonitor.recordMetric({
          timestamp: new Date(),
          operation: 'ai_categorization',
          duration,
          success: true,
        });
      }

      return categoryName;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failed metric
      await this.performanceMonitor.recordMetric({
        timestamp: new Date(),
        operation: 'ai_categorization',
        duration,
        success: false,
        error: error.message,
      });

      this.logger.error(`Error calling OpenAI API for transaction "${transactionDescription}": ${error.message}`, error.stack);
      
      // If it's a network/timeout error, we might want to retry or use a fallback
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('OpenAI API request timed out');
      }
      
      // For other errors, re-throw with more context
      throw new Error(`OpenAI API call failed: ${error.message}`);
    }
  }

  private async categorizeSingleTransaction(
    transaction: TransactionForCategorizationDto,
  ): Promise<CategorizedTransactionDto | null> {
    const processedTx = await this.preprocessTransaction(transaction);
    if (!processedTx) {
      // Preprocessing failed critical validation, return null or an error DTO
      return {
        id: transaction.id, // Use original ID if available
        category: 'Error: Preprocessing Failed',
        rawApiResponse: { error: 'Critical validation failed during preprocessing.' }
      };
    }

    const normalizedMerchantName = processedTx.description; // Using preprocessed description as normalized name for now

    // 1. Check cache first
    const cacheStartTime = Date.now();
    const cachedCategoryId = await this.cacheService.getCachedCategory(normalizedMerchantName);
    const cacheDuration = Date.now() - cacheStartTime;
    
    if (cachedCategoryId) {
      this.logger.log(`Cache HIT for merchant '${normalizedMerchantName}'. Category: ${cachedCategoryId}`);
      
      // Record cache hit metric
      await this.performanceMonitor.recordMetric({
        timestamp: new Date(),
        operation: 'cache_lookup',
        duration: cacheDuration,
        success: true,
        cacheHit: true,
      });
      
      return {
        id: processedTx.id,
        category: cachedCategoryId,
      };
    }
    
    this.logger.log(`Cache MISS for merchant '${normalizedMerchantName}'. Proceeding to hybrid categorization.`);
    
    // Record cache miss metric
    await this.performanceMonitor.recordMetric({
      timestamp: new Date(),
      operation: 'cache_lookup',
      duration: cacheDuration,
      success: true,
      cacheHit: false,
    });

    // 2. Try rule-based categorization first
    const ruleResult = await this.ruleBasedCategorizationService.categorizeByRules(processedTx);
    
    if (ruleResult && ruleResult.confidence >= 85) {
      // High confidence rule match - use it directly (skip AI call for cost optimization)
      this.logger.log(`Rule-based categorization HIGH CONFIDENCE (${ruleResult.confidence}%) for '${normalizedMerchantName}': ${ruleResult.category}`);
      
      // Cache the rule-based result
      await this.cacheService.setCachedCategory(normalizedMerchantName, ruleResult.category, false);
      
      return {
        id: processedTx.id,
        category: ruleResult.category,
        confidence: ruleResult.confidence / 100, // Convert percentage to decimal
      };
    }

    // 3. For medium/low confidence rules or no rule match, use AI categorization
    if (!this.openAIApiKey) {
      this.logger.warn(`OpenAI API key not configured. Cannot perform AI categorization for '${normalizedMerchantName}'.`);
      
      // Fallback to rule result if available, otherwise return "Other"
      const fallbackCategory = ruleResult ? ruleResult.category : 'Other';
      const fallbackConfidence = ruleResult ? ruleResult.confidence / 100 : 0.5;
      
      return {
        id: processedTx.id,
        category: fallbackCategory,
        confidence: fallbackConfidence,
        rawApiResponse: { error: 'OpenAI API key not configured' }
      };
    }
    
    try {
      // Log rule suggestion if available
      if (ruleResult) {
        this.logger.log(`Rule-based suggestion (${ruleResult.confidence}%): ${ruleResult.category} for '${normalizedMerchantName}'. Validating with AI.`);
      }
      
      const aiGeneratedCategory = await this.callOpenAIForCategorization(normalizedMerchantName);
      
      // 4. Hybrid logic: Compare AI result with rule result if available
      let finalCategory = aiGeneratedCategory;
      let finalConfidence = 0.85; // Default AI confidence
      
      if (ruleResult) {
        const ruleConfidenceDecimal = ruleResult.confidence / 100;
        
        if (ruleResult.category === aiGeneratedCategory) {
          // Agreement between rule and AI - boost confidence
          finalConfidence = Math.min(0.95, Math.max(ruleConfidenceDecimal, 0.85) + 0.1);
          this.logger.log(`Rule-AI AGREEMENT for '${normalizedMerchantName}': ${finalCategory} (boosted confidence: ${(finalConfidence * 100).toFixed(1)}%)`);
        } else {
          // Disagreement - use higher confidence result
          if (ruleConfidenceDecimal > 0.85) {
            finalCategory = ruleResult.category;
            finalConfidence = ruleConfidenceDecimal;
            this.logger.warn(`Rule-AI DISAGREEMENT for '${normalizedMerchantName}': Using rule result ${ruleResult.category} (${ruleResult.confidence}%) over AI result ${aiGeneratedCategory}`);
          } else {
            // Use AI result but log the disagreement
            this.logger.warn(`Rule-AI DISAGREEMENT for '${normalizedMerchantName}': Using AI result ${aiGeneratedCategory} over rule result ${ruleResult.category} (${ruleResult.confidence}%)`);
          }
        }
      }
      
      // 5. Cache the final result
      await this.cacheService.setCachedCategory(normalizedMerchantName, finalCategory, false);

      return {
        id: processedTx.id,
        category: finalCategory,
        confidence: finalConfidence,
      };

    } catch (error) {
      this.logger.error(`AI categorization failed for '${normalizedMerchantName}': ${error.message}`, error.stack);
      
      // Fallback to rule result if available
      if (ruleResult) {
        this.logger.log(`Falling back to rule-based result for '${normalizedMerchantName}': ${ruleResult.category} (${ruleResult.confidence}%)`);
        
        // Cache the rule-based fallback
        await this.cacheService.setCachedCategory(normalizedMerchantName, ruleResult.category, false);
        
        return {
          id: processedTx.id,
          category: ruleResult.category,
          confidence: ruleResult.confidence / 100,
          rawApiResponse: { error: `AI failed, used rule fallback: ${error.message}` },
        };
      }
      
      // No rule result available - return "Other" as final fallback
      return {
        id: processedTx.id,
        category: 'Other', // Final fallback
        confidence: 0.5,
        rawApiResponse: { error: error.message },
      };
    }
  }

  async categorizeTransactions(
    transactions: TransactionForCategorizationDto[],
  ): Promise<CategorizedTransactionDto[]> {
    this.logger.log(`Received ${transactions.length} transactions for categorization.`);
    const results: CategorizedTransactionDto[] = [];

    for (const tx of transactions) {
      try {
        const categorizedTx = await this.categorizeSingleTransaction(tx);
        if (categorizedTx) {
          results.push(categorizedTx);
        } else {
          // Handle cases where categorizeSingleTransaction itself might return null (e.g. severe error)
          // For now, it returns an error DTO, so this path might not be hit often.
          this.logger.warn(`Transaction ${(tx && tx.id) || 'Unknown ID'} could not be categorized and was skipped.`);
        }
      } catch (error) {
        this.logger.error(`Error categorizing transaction ${(tx && tx.id) || 'Unknown ID'}: ${error.message}`, error.stack);
        results.push({
          id: (tx && tx.id) || 'unknown',
          category: 'Error: Categorization Failed',
          rawApiResponse: { error: error.message },
        });
      }
    }
    this.logger.log(`Categorization process finished. Returning ${results.length} results.`);
    return results;
  }

  async updateUserCategoryCorrection(
    normalizedMerchantName: string, 
    correctedCategoryId: string
  ): Promise<void> {
    if (!normalizedMerchantName || !correctedCategoryId) {
      throw new BadRequestException('Normalized merchant name and corrected category ID are required.');
    }
    
    // Validate that the corrected category is one of our predefined categories
    if (!PREDEFINED_CATEGORIES.includes(correctedCategoryId as TransactionCategory)) {
      throw new BadRequestException(`Invalid category "${correctedCategoryId}". Must be one of: ${PREDEFINED_CATEGORIES.join(', ')}`);
    }
    
    this.logger.log(`User correction: Merchant '${normalizedMerchantName}' -> Category '${correctedCategoryId}'`);
    await this.cacheService.setCachedCategory(normalizedMerchantName, correctedCategoryId, true);
    // Optionally: Trigger a background job to re-evaluate similar transactions or log this correction for model retraining analysis.
  }

  // Utility method to get the list of available categories
  getAvailableCategories(): readonly string[] {
    return PREDEFINED_CATEGORIES;
  }
} 