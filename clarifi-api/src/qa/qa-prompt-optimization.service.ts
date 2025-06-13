import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
  metadata: {
    category: 'financial' | 'general' | 'specific';
    canadianOptimized: boolean;
    targetAudience: 'general' | 'newcomer' | 'experienced';
    lastOptimized: string;
  };
}

export interface PromptTestResult {
  promptId: string;
  testQuery: string;
  expectedCategory: string;
  response: string;
  responseTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  accuracy: number; // 0-1 score
  relevance: number; // 0-1 score
  canadianContext: number; // 0-1 score
  timestamp: string;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  promptVariants: string[]; // Array of prompt IDs
  trafficSplit: number[]; // Percentage for each variant
  testMetrics: string[]; // Metrics to track
  startDate: string;
  endDate: string;
  active: boolean;
}

@Injectable()
export class QAPromptOptimizationService {
  private readonly logger = new Logger(QAPromptOptimizationService.name);
  private readonly CACHE_PREFIX = 'qa_prompt_optimization';
  
  // Optimized prompt templates for Canadian financial advice
  private readonly promptTemplates: PromptTemplate[] = [
    {
      id: 'canadian_financial_v1',
      name: 'Canadian Financial Advisor - Concise',
      version: '1.0',
      systemPrompt: `You are a knowledgeable Canadian financial advisor specializing in helping Canadians with banking, credit, budgeting, and financial planning.

IMPORTANT GUIDELINES:
- Provide accurate, practical advice specific to Canada's financial system
- Reference Canadian financial institutions, regulations, and products when relevant
- Keep responses concise and actionable (max 150 words)
- Use Canadian dollar amounts and current Canadian interest rates
- Mention relevant government programs (TFSA, RRSP, CPP, etc.)
- If unsure about current rates/limits, advise checking official sources

CONTEXT: User is using ClariFi, a privacy-focused financial management app for Canadians.`,
      userPromptTemplate: 'Question: {{query}}\n\nProvide a helpful, concise answer focused on Canadian financial context.',
      maxTokens: 200,
      temperature: 0.3,
      metadata: {
        category: 'financial',
        canadianOptimized: true,
        targetAudience: 'general',
        lastOptimized: '2024-12-05'
      }
    },
    {
      id: 'canadian_financial_v2',
      name: 'Canadian Financial Advisor - Detailed',
      version: '2.0',
      systemPrompt: `You are an expert Canadian financial advisor providing comprehensive guidance on banking, investments, credit, and financial planning for Canadian residents.

KEY FOCUS AREAS:
- Canadian banking system (Big Six banks, credit unions, online banks)
- Credit building and management (Equifax/TransUnion, Canadian credit scores)
- Tax-advantaged accounts (TFSA, RRSP, FHSA, RESP)
- Canadian financial regulations and consumer protections
- Budgeting for Canadian cost of living

RESPONSE REQUIREMENTS:
- Maximum 200 words for efficiency
- Include specific Canadian examples when possible
- Reference current contribution limits and rates where applicable
- Suggest next steps or resources when helpful

CANADIAN CONTEXT: All advice must be relevant to Canadian financial landscape, regulations, and institutions.`,
      userPromptTemplate: 'Canadian Financial Query: {{query}}\n\nContext: {{context}}\n\nProvide expert Canadian financial advice.',
      maxTokens: 250,
      temperature: 0.2,
      metadata: {
        category: 'financial',
        canadianOptimized: true,
        targetAudience: 'general',
        lastOptimized: '2024-12-05'
      }
    },
    {
      id: 'newcomer_optimized_v1',
      name: 'Newcomer-Focused Financial Advisor',
      version: '1.0',
      systemPrompt: `You are a financial advisor specializing in helping newcomers to Canada navigate the Canadian financial system.

NEWCOMER-SPECIFIC GUIDANCE:
- Explain Canadian financial concepts clearly for those unfamiliar with the system
- Focus on building credit history from zero
- Emphasize essential banking needs and account types
- Mention newcomer-specific programs and benefits
- Address common challenges faced by new Canadians

COMMUNICATION STYLE:
- Clear, jargon-free explanations
- Step-by-step guidance when possible
- Reassuring and supportive tone
- Maximum 180 words for clarity

CANADIAN BANKING FOCUS: Help newcomers understand and access Canadian financial services effectively.`,
      userPromptTemplate: 'Newcomer Question: {{query}}\n\nProvide newcomer-friendly Canadian financial guidance.',
      maxTokens: 220,
      temperature: 0.3,
      metadata: {
        category: 'financial',
        canadianOptimized: true,
        targetAudience: 'newcomer',
        lastOptimized: '2024-12-05'
      }
    },
    {
      id: 'clarifi_focused_v1',
      name: 'ClariFi-Focused Financial Advisor',
      version: '1.0',
      systemPrompt: `You are a financial advisor with expertise in ClariFi app features and Canadian financial management.

CLARIFI CONTEXT:
- ClariFi is a privacy-focused financial management app for Canadians
- Features include AI-powered transaction categorization, credit utilization tracking, and financial insights
- Users upload bank statements for analysis (privacy-first approach)
- Supports major Canadian banks and financial institutions

GUIDANCE APPROACH:
- When relevant, mention how ClariFi can help with the user's financial goals
- Provide general Canadian financial advice alongside ClariFi-specific insights
- Keep responses practical and actionable (max 160 words)
- Balance product guidance with independent financial advice

Focus on helping users maximize their financial health using both ClariFi tools and Canadian financial best practices.`,
      userPromptTemplate: 'ClariFi User Question: {{query}}\n\nProvide advice considering ClariFi features and Canadian financial context.',
      maxTokens: 200,
      temperature: 0.3,
      metadata: {
        category: 'specific',
        canadianOptimized: true,
        targetAudience: 'general',
        lastOptimized: '2024-12-05'
      }
    }
  ];

  // Test queries for prompt evaluation
  private readonly testQueries = [
    {
      query: "How can I improve my credit score quickly?",
      expectedCategory: "credit",
      expectedElements: ["payment history", "credit utilization", "Equifax", "TransUnion"]
    },
    {
      query: "What's the difference between TFSA and RRSP?",
      expectedCategory: "banking",
      expectedElements: ["tax-free", "contribution room", "retirement", "withdrawal"]
    },
    {
      query: "Which Canadian bank should I choose?",
      expectedCategory: "banking",
      expectedElements: ["Big Six", "credit union", "fees", "services"]
    },
    {
      query: "How much should I save for emergencies?",
      expectedCategory: "budgeting",
      expectedElements: ["3-6 months", "expenses", "emergency fund"]
    },
    {
      query: "How does ClariFi protect my privacy?",
      expectedCategory: "clarifi",
      expectedElements: ["privacy", "encryption", "data", "security"]
    },
    {
      query: "I'm new to Canada, how do I build credit?",
      expectedCategory: "newcomer",
      expectedElements: ["secured credit card", "credit history", "SIN"]
    }
  ];

  constructor(private readonly redisService: RedisService) {}

  /**
   * Get optimized prompt for a given context
   */
  async getOptimalPrompt(
    query: string,
    userContext?: {
      isNewcomer?: boolean;
      isClariFiUser?: boolean;
      previousQueries?: string[];
    }
  ): Promise<PromptTemplate> {
    try {
      // Determine best prompt template based on context
      if (userContext?.isNewcomer) {
        return this.promptTemplates.find(p => p.id === 'newcomer_optimized_v1') || this.promptTemplates[0];
      }
      
      if (userContext?.isClariFiUser && this.queryMentionsClariFi(query)) {
        return this.promptTemplates.find(p => p.id === 'clarifi_focused_v1') || this.promptTemplates[0];
      }

      // Check if we're in an A/B test
      const activeTest = await this.getActiveABTest();
      if (activeTest) {
        const selectedVariant = await this.selectABTestVariant(activeTest);
        const template = this.promptTemplates.find(p => p.id === selectedVariant);
        if (template) {
          await this.recordABTestExposure(activeTest.id, selectedVariant, query);
          return template;
        }
      }

      // Default to the most optimized general template
      return this.promptTemplates.find(p => p.id === 'canadian_financial_v2') || this.promptTemplates[0];

    } catch (error) {
      this.logger.error(`Error getting optimal prompt: ${error.message}`);
      return this.promptTemplates[0]; // Fallback to first template
    }
  }

  /**
   * Test all prompt templates with standard queries
   */
  async runPromptPerformanceTest(): Promise<{
    overallResults: { [promptId: string]: PromptTestResult[] };
    recommendations: string[];
    summary: {
      bestPerforming: string;
      mostCostEfficient: string;
      mostCanadianOptimized: string;
    };
  }> {
    this.logger.log('Starting comprehensive prompt performance test');
    
    const results: { [promptId: string]: PromptTestResult[] } = {};
    
    // Test each prompt template
    for (const template of this.promptTemplates) {
      results[template.id] = [];
      
      for (const testCase of this.testQueries) {
        try {
          const testResult = await this.testPromptTemplate(template, testCase);
          results[template.id].push(testResult);
        } catch (error) {
          this.logger.error(`Test failed for prompt ${template.id} with query "${testCase.query}": ${error.message}`);
        }
      }
    }

    // Analyze results and generate recommendations
    const analysis = this.analyzeTestResults(results);
    
    // Cache results for future reference
    await this.cacheTestResults(results, analysis);
    
    return {
      overallResults: results,
      recommendations: analysis.recommendations,
      summary: analysis.summary
    };
  }

  /**
   * Start A/B testing for prompt variants
   */
  async startABTest(config: ABTestConfig): Promise<void> {
    this.logger.log(`Starting A/B test: ${config.name}`);
    
    // Validate configuration
    if (config.promptVariants.length !== config.trafficSplit.length) {
      throw new Error('Prompt variants and traffic split arrays must have the same length');
    }
    
    if (config.trafficSplit.reduce((sum, split) => sum + split, 0) !== 100) {
      throw new Error('Traffic split must sum to 100%');
    }

    // Store A/B test configuration
    await this.redisService.setex(
      `${this.CACHE_PREFIX}:ab_test:${config.id}`,
      86400 * 30, // 30 days
      JSON.stringify({ ...config, active: true })
    );

    // Initialize metrics tracking
    for (const variantId of config.promptVariants) {
      await this.redisService.setex(
        `${this.CACHE_PREFIX}:ab_metrics:${config.id}:${variantId}`,
        86400 * 30,
        JSON.stringify({
          exposures: 0,
          responses: 0,
          totalCost: 0,
          totalTokens: 0,
          averageResponseTime: 0,
          satisfactionScores: []
        })
      );
    }

    this.logger.log(`A/B test ${config.id} started successfully`);
  }

  /**
   * Get A/B test results and analysis
   */
  async getABTestResults(testId: string): Promise<{
    config: ABTestConfig;
    results: { [variantId: string]: any };
    analysis: {
      winner?: string;
      statisticalSignificance: boolean;
      recommendations: string[];
    };
  }> {
    try {
      const configData = await this.redisService.get(`${this.CACHE_PREFIX}:ab_test:${testId}`);
      if (!configData) {
        throw new Error(`A/B test ${testId} not found`);
      }

      const config: ABTestConfig = JSON.parse(configData);
      const results: { [variantId: string]: any } = {};

      // Collect results for each variant
      for (const variantId of config.promptVariants) {
        const metricsData = await this.redisService.get(`${this.CACHE_PREFIX}:ab_metrics:${testId}:${variantId}`);
        if (metricsData) {
          results[variantId] = JSON.parse(metricsData);
        }
      }

      // Analyze results
      const analysis = this.analyzeABTestResults(results);

      return { config, results, analysis };

    } catch (error) {
      this.logger.error(`Error getting A/B test results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current prompt optimization metrics
   */
  async getOptimizationMetrics(): Promise<{
    templatePerformance: { [templateId: string]: any };
    costEfficiency: {
      averageCostPerQuery: number;
      tokenEfficiency: number;
      recommendedTemplate: string;
    };
    qualityMetrics: {
      averageAccuracy: number;
      canadianContextScore: number;
      userSatisfaction: number;
    };
    activeTests: string[];
  }> {
    try {
      // Get cached performance data
      const performanceData = await this.redisService.get(`${this.CACHE_PREFIX}:template_performance`);
      const templatePerformance = performanceData ? JSON.parse(performanceData) : {};

      // Calculate cost efficiency metrics
      const costEfficiency = await this.calculateCostEfficiency(templatePerformance);
      
      // Calculate quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(templatePerformance);

      // Get active A/B tests
      const activeTests = await this.getActiveABTests();

      return {
        templatePerformance,
        costEfficiency,
        qualityMetrics,
        activeTests
      };

    } catch (error) {
      this.logger.error(`Error getting optimization metrics: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods

  private async testPromptTemplate(
    template: PromptTemplate, 
    testCase: { query: string; expectedCategory: string; expectedElements: string[] }
  ): Promise<PromptTestResult> {
    const startTime = Date.now();
    
    // Simulate LLM call with the template
    // In a real implementation, this would call the actual LLM service
    const mockResponse = this.generateMockResponse(template, testCase);
    
    const responseTime = Date.now() - startTime;
    const tokenUsage = this.estimateTokenUsage(template, testCase.query, mockResponse);
    
    return {
      promptId: template.id,
      testQuery: testCase.query,
      expectedCategory: testCase.expectedCategory,
      response: mockResponse,
      responseTime,
      tokenUsage,
      cost: this.calculateCost(tokenUsage),
      accuracy: this.evaluateAccuracy(mockResponse, testCase.expectedElements),
      relevance: this.evaluateRelevance(mockResponse, testCase.query),
      canadianContext: this.evaluateCanadianContext(mockResponse),
      timestamp: new Date().toISOString()
    };
  }

  private queryMentionsClariFi(query: string): boolean {
    const clarifiKeywords = ['clarifi', 'app', 'categorization', 'privacy', 'upload', 'statement'];
    return clarifiKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }

  private async getActiveABTest(): Promise<ABTestConfig | null> {
    try {
      // This would scan Redis for active A/B tests
      // For now, return null (no active tests)
      return null;
    } catch {
      return null;
    }
  }

  private async selectABTestVariant(test: ABTestConfig): Promise<string> {
    // Weighted random selection based on traffic split
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < test.promptVariants.length; i++) {
      cumulative += test.trafficSplit[i];
      if (random <= cumulative) {
        return test.promptVariants[i];
      }
    }
    
    return test.promptVariants[0]; // Fallback
  }

  private async recordABTestExposure(testId: string, variantId: string, query: string): Promise<void> {
    try {
      const metricsKey = `${this.CACHE_PREFIX}:ab_metrics:${testId}:${variantId}`;
      const metricsData = await this.redisService.get(metricsKey);
      
      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        metrics.exposures++;
        
        await this.redisService.setex(metricsKey, 86400 * 30, JSON.stringify(metrics));
      }
    } catch (error) {
      this.logger.warn(`Failed to record A/B test exposure: ${error.message}`);
    }
  }

  private analyzeTestResults(results: { [promptId: string]: PromptTestResult[] }): {
    recommendations: string[];
    summary: {
      bestPerforming: string;
      mostCostEfficient: string;
      mostCanadianOptimized: string;
    };
  } {
    const recommendations: string[] = [];
    let bestPerforming = '';
    let mostCostEfficient = '';
    let mostCanadianOptimized = '';
    
    let highestAccuracy = 0;
    let lowestCost = Infinity;
    let highestCanadianScore = 0;

    // Analyze each prompt's performance
    for (const [promptId, testResults] of Object.entries(results)) {
      const avgAccuracy = testResults.reduce((sum, r) => sum + r.accuracy, 0) / testResults.length;
      const avgCost = testResults.reduce((sum, r) => sum + r.cost, 0) / testResults.length;
      const avgCanadianScore = testResults.reduce((sum, r) => sum + r.canadianContext, 0) / testResults.length;

      if (avgAccuracy > highestAccuracy) {
        highestAccuracy = avgAccuracy;
        bestPerforming = promptId;
      }

      if (avgCost < lowestCost) {
        lowestCost = avgCost;
        mostCostEfficient = promptId;
      }

      if (avgCanadianScore > highestCanadianScore) {
        highestCanadianScore = avgCanadianScore;
        mostCanadianOptimized = promptId;
      }
    }

    // Generate recommendations
    recommendations.push(`Best overall performance: ${bestPerforming} (${(highestAccuracy * 100).toFixed(1)}% accuracy)`);
    recommendations.push(`Most cost-efficient: ${mostCostEfficient} ($${lowestCost.toFixed(4)} avg per query)`);
    recommendations.push(`Best Canadian context: ${mostCanadianOptimized} (${(highestCanadianScore * 100).toFixed(1)}% score)`);

    if (highestAccuracy < 0.8) {
      recommendations.push('Consider prompt refinement to improve accuracy above 80%');
    }

    if (lowestCost > 0.005) {
      recommendations.push('Optimize prompts for cost efficiency - target <$0.005 per query');
    }

    return {
      recommendations,
      summary: {
        bestPerforming,
        mostCostEfficient,
        mostCanadianOptimized
      }
    };
  }

  private analyzeABTestResults(results: { [variantId: string]: any }): {
    winner?: string;
    statisticalSignificance: boolean;
    recommendations: string[];
  } {
    // Simplified A/B test analysis
    // In practice, would use proper statistical tests
    
    let winner: string | undefined;
    let bestMetric = 0;
    
    for (const [variantId, metrics] of Object.entries(results)) {
      const score = metrics.satisfactionScores.length > 0 
        ? metrics.satisfactionScores.reduce((sum: number, score: number) => sum + score, 0) / metrics.satisfactionScores.length
        : 0;
        
      if (score > bestMetric) {
        bestMetric = score;
        winner = variantId;
      }
    }

    return {
      winner,
      statisticalSignificance: false, // Would need proper statistical analysis
      recommendations: [
        winner ? `Variant ${winner} shows best performance` : 'No clear winner identified',
        'Continue test for statistical significance',
        'Monitor cost efficiency alongside quality metrics'
      ]
    };
  }

  private async cacheTestResults(results: any, analysis: any): Promise<void> {
    try {
      await this.redisService.setex(
        `${this.CACHE_PREFIX}:test_results`,
        86400, // 24 hours
        JSON.stringify({ results, analysis, timestamp: Date.now() })
      );
    } catch (error) {
      this.logger.warn(`Failed to cache test results: ${error.message}`);
    }
  }

  private generateMockResponse(template: PromptTemplate, testCase: any): string {
    // Generate a realistic mock response based on the query
    const query = testCase.query.toLowerCase();
    
    if (query.includes('credit score')) {
      return `To improve your credit score in Canada: 1) Pay bills on time (35% of score), 2) Keep credit utilization below 30%, 3) Check your Equifax and TransUnion reports regularly, 4) Consider a secured credit card if building credit. Most improvements show in 3-6 months with consistent habits.`;
    }
    
    if (query.includes('tfsa') || query.includes('rrsp')) {
      return `TFSA vs RRSP: TFSA contributions aren't tax-deductible but withdrawals are tax-free. 2024 limit: $7,000. RRSP contributions are tax-deductible, reducing current taxes, but withdrawals are taxed. Choose TFSA if in lower tax bracket now, RRSP if expecting lower retirement income.`;
    }
    
    return `Based on Canadian financial best practices, here's my recommendation for your situation. Consider consulting with a fee-only financial advisor for personalized advice. Always verify current rates and limits with official government sources.`;
  }

  private estimateTokenUsage(template: PromptTemplate, query: string, response: string): {
    input: number;
    output: number;
    total: number;
  } {
    // Rough token estimation (1 token ≈ 4 characters)
    const inputTokens = Math.ceil((template.systemPrompt.length + query.length) / 4);
    const outputTokens = Math.ceil(response.length / 4);
    
    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    };
  }

  private calculateCost(tokenUsage: { input: number; output: number; total: number }): number {
    // GPT-3.5-turbo pricing (approximate)
    const inputCostPer1k = 0.0015;  // $0.0015 per 1K input tokens
    const outputCostPer1k = 0.002;  // $0.002 per 1K output tokens
    
    return (tokenUsage.input / 1000 * inputCostPer1k) + (tokenUsage.output / 1000 * outputCostPer1k);
  }

  private evaluateAccuracy(response: string, expectedElements: string[]): number {
    const lowerResponse = response.toLowerCase();
    const foundElements = expectedElements.filter(element => 
      lowerResponse.includes(element.toLowerCase())
    );
    
    return foundElements.length / expectedElements.length;
  }

  private evaluateRelevance(response: string, query: string): number {
    // Simple relevance scoring based on keyword overlap
    const queryWords = query.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    const overlap = queryWords.filter(word => 
      responseWords.some(resWord => resWord.includes(word) || word.includes(resWord))
    );
    
    return Math.min(overlap.length / queryWords.length, 1.0);
  }

  private evaluateCanadianContext(response: string): number {
    const canadianKeywords = [
      'canada', 'canadian', 'cra', 'tfsa', 'rrsp', 'cpp', 'oas', 'gic',
      'equifax', 'transunion', 'big six', 'credit union', 'interac',
      'cdic', 'osfi', 'provincial', 'federal', 'dollar', 'cad'
    ];
    
    const lowerResponse = response.toLowerCase();
    const foundKeywords = canadianKeywords.filter(keyword => 
      lowerResponse.includes(keyword)
    );
    
    return Math.min(foundKeywords.length / 3, 1.0); // Normalize to max 3 keywords for 100%
  }

  private async calculateCostEfficiency(templatePerformance: any): Promise<{
    averageCostPerQuery: number;
    tokenEfficiency: number;
    recommendedTemplate: string;
  }> {
    // Mock implementation - would analyze real performance data
    return {
      averageCostPerQuery: 0.003,
      tokenEfficiency: 0.85,
      recommendedTemplate: 'canadian_financial_v2'
    };
  }

  private async calculateQualityMetrics(templatePerformance: any): Promise<{
    averageAccuracy: number;
    canadianContextScore: number;
    userSatisfaction: number;
  }> {
    // Mock implementation - would analyze real quality data
    return {
      averageAccuracy: 0.87,
      canadianContextScore: 0.92,
      userSatisfaction: 0.89
    };
  }

  private async getActiveABTests(): Promise<string[]> {
    // Mock implementation - would scan Redis for active tests
    return [];
  }
} 