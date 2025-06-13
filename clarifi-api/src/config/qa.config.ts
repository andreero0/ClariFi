import { registerAs } from '@nestjs/config';

export interface QAConfig {
  // LLM Configuration
  modelName: string;
  temperature: number;
  maxTokens: number;
  
  // Cost Control
  costThresholds: {
    maxCostPerUser: number;
    maxCostPerQuery: number;
    dailyBudgetLimit: number;
  };
  
  // Query Limits
  queryLimits: {
    freeUserLimit: number;
    premiumUserLimit: number;
    timeWindow: number; // hours
  };
  
  // Cache Configuration
  cache: {
    faqTtlSeconds: number;
    llmTtlSeconds: number;
    enableSimilarityMatching: boolean;
  };
  
  // Canadian Financial Context
  context: {
    enableCanadianContext: boolean;
    strictCanadianOnly: boolean;
    includeRegulatoryGuidance: boolean;
  };
}

export default registerAs('qa', (): QAConfig => ({
  // LLM Configuration - Optimized for cost and quality
  modelName: process.env.QA_MODEL_NAME || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.QA_TEMPERATURE || '0.3'),
  maxTokens: parseInt(process.env.QA_MAX_TOKENS || '200', 10),
  
  // Cost Control - Target <$0.10 per user per month
  costThresholds: {
    maxCostPerUser: parseFloat(process.env.QA_MAX_COST_PER_USER || '0.10'), // $0.10 per user per month
    maxCostPerQuery: parseFloat(process.env.QA_MAX_COST_PER_QUERY || '0.01'), // $0.01 per query max
    dailyBudgetLimit: parseFloat(process.env.QA_DAILY_BUDGET_LIMIT || '10.00'), // $10 total daily budget
  },
  
  // Query Limits - 5 AI questions per user per period
  queryLimits: {
    freeUserLimit: parseInt(process.env.QA_FREE_USER_LIMIT || '5', 10), // 5 AI questions per month
    premiumUserLimit: parseInt(process.env.QA_PREMIUM_USER_LIMIT || '20', 10), // 20 AI questions per month
    timeWindow: parseInt(process.env.QA_TIME_WINDOW_HOURS || '720', 10), // 30 days (720 hours)
  },
  
  // Cache Configuration - Optimize for FAQ hit rate >95%
  cache: {
    faqTtlSeconds: parseInt(process.env.QA_FAQ_CACHE_TTL_SECONDS || '2592000', 10), // 30 days
    llmTtlSeconds: parseInt(process.env.QA_LLM_CACHE_TTL_SECONDS || '2592000', 10), // 30 days
    enableSimilarityMatching: process.env.QA_ENABLE_SIMILARITY_MATCHING !== 'false',
  },
  
  // Canadian Financial Context
  context: {
    enableCanadianContext: process.env.QA_ENABLE_CANADIAN_CONTEXT !== 'false',
    strictCanadianOnly: process.env.QA_STRICT_CANADIAN_ONLY === 'true',
    includeRegulatoryGuidance: process.env.QA_INCLUDE_REGULATORY_GUIDANCE !== 'false',
  },
})); 