import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { CategorizationService } from './categorization.service';
import { CategorizationCacheService } from './categorization-cache.service';
import { RuleBasedCategorizationService } from './rule-based-categorization.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { TransactionForCategorizationDto } from './dto/categorization.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('CategorizationService', () => {
  let service: CategorizationService;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;
  let cacheService: jest.Mocked<CategorizationCacheService>;
  let ruleBasedService: jest.Mocked<RuleBasedCategorizationService>;
  let performanceMonitor: jest.Mocked<PerformanceMonitorService>;

  const mockTransaction: TransactionForCategorizationDto = {
    id: 'test-transaction-1',
    description: 'TIM HORTONS #123 TORONTO ON',
    amount: 5.50,
    date: '2025-01-01T10:00:00Z'
  };

  const mockOpenAIResponse = {
    data: {
      choices: [{
        message: {
          content: '{"category": "Dining Out"}'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 5,
        total_tokens: 55
      }
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    request: {}
  } as AxiosResponse;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn()
    };

    const mockHttpService = {
      post: jest.fn()
    };

    const mockCacheService = {
      getCachedCategory: jest.fn(),
      setCachedCategory: jest.fn(),
      generateCacheKey: jest.fn()
    };

    const mockRuleBasedService = {
      categorizeByRules: jest.fn(),
      getCoverageAnalysis: jest.fn()
    };

    const mockPerformanceMonitor = {
      recordApiCall: jest.fn(),
      recordCategorizationEvent: jest.fn(),
      recordCacheEvent: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategorizationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: CategorizationCacheService, useValue: mockCacheService },
        { provide: RuleBasedCategorizationService, useValue: mockRuleBasedService },
        { provide: PerformanceMonitorService, useValue: mockPerformanceMonitor }
      ],
    }).compile();

    service = module.get<CategorizationService>(CategorizationService);
    configService = module.get(ConfigService);
    httpService = module.get(HttpService);
    cacheService = module.get(CategorizationCacheService);
    ruleBasedService = module.get(RuleBasedCategorizationService);
    performanceMonitor = module.get(PerformanceMonitorService);

    // Setup default config values
    configService.get.mockImplementation((key: string) => {
      const configMap = {
        'OPENAI_API_KEY': 'test-api-key',
        'OPENAI_CHAT_COMPLETION_URL': 'https://api.openai.com/v1/chat/completions',
        'OPENAI_MODEL_NAME': 'gpt-3.5-turbo',
        'OPENAI_REQUEST_TEMPERATURE': 0.2,
        'OPENAI_MAX_TOKENS_RESPONSE': 20,
        'RULE_BASED_HIGH_CONFIDENCE_THRESHOLD': 85,
        'RULE_BASED_MEDIUM_CONFIDENCE_THRESHOLD': 70,
        'HYBRID_AI_RULE_AGREEMENT_BONUS': 10
      };
      return configMap[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableCategories', () => {
    it('should return all predefined categories', () => {
      const categories = service.getAvailableCategories();

      expect(categories).toContain('Groceries');
      expect(categories).toContain('Transportation');
      expect(categories).toContain('Dining Out');
      expect(categories).toContain('Other');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle service initialization', () => {
      expect(service).toBeDefined();
      expect(typeof service.getAvailableCategories).toBe('function');
    });
  });
});
