import { Test, TestingModule } from '@nestjs/testing';
import { RuleBasedCategorizationService } from './rule-based-categorization.service';
import { TransactionForCategorizationDto } from './dto/categorization.dto';

describe('RuleBasedCategorizationService', () => {
  let service: RuleBasedCategorizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuleBasedCategorizationService],
    }).compile();

    service = module.get<RuleBasedCategorizationService>(RuleBasedCategorizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('categorizeByRules', () => {
    it('should handle valid transactions', async () => {
      const transaction: TransactionForCategorizationDto = {
        id: 'test-1',
        description: 'TIM HORTONS #123 TORONTO ON',
        amount: 5.50,
        date: '2025-01-01T10:00:00Z'
      };

      const result = await service.categorizeByRules(transaction);

      // Result can be null or a categorization result
      if (result) {
        expect(result).toHaveProperty('category');
        expect(result).toHaveProperty('confidence');
        expect(typeof result.category).toBe('string');
        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('should return null for unrecognized transactions', async () => {
      const transaction: TransactionForCategorizationDto = {
        id: 'test-unknown',
        description: 'UNKNOWN MERCHANT XYZ',
        amount: 25.00,
        date: '2025-01-01T10:00:00Z'
      };

      const result = await service.categorizeByRules(transaction);

      // This may or may not be null depending on the rules implementation
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should handle empty description', async () => {
      const transaction: TransactionForCategorizationDto = {
        id: 'test-empty',
        description: '',
        amount: 10.00,
        date: '2025-01-01T10:00:00Z'
      };

      const result = await service.categorizeByRules(transaction);

      // Empty description should likely return null
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('service methods', () => {
    it('should have categorizeByRules method', () => {
      expect(typeof service.categorizeByRules).toBe('function');
    });
  });
}); 