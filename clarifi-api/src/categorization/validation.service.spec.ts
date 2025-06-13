import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ValidationService } from './validation.service';
import { CategorizationService } from './categorization.service';
import { PerformanceMonitorService } from './performance-monitor.service';

describe('ValidationService', () => {
  let service: ValidationService;
  let categorizationService: jest.Mocked<CategorizationService>;
  let performanceMonitor: jest.Mocked<PerformanceMonitorService>;

  beforeEach(async () => {
    const mockCategorizationService = {
      categorizeTransactions: jest.fn(),
    };

    const mockPerformanceMonitor = {
      getCacheStatistics: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        { provide: CategorizationService, useValue: mockCategorizationService },
        { provide: PerformanceMonitorService, useValue: mockPerformanceMonitor },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    categorizationService = module.get(CategorizationService);
    performanceMonitor = module.get(PerformanceMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSyntheticDataset', () => {
    it('should generate the correct number of transactions', () => {
      const count = 10;
      const dataset = service.generateSyntheticDataset(count);

      expect(dataset).toHaveLength(count);
      expect(dataset[0]).toHaveProperty('id');
      expect(dataset[0]).toHaveProperty('description');
      expect(dataset[0]).toHaveProperty('amount');
      expect(dataset[0]).toHaveProperty('groundTruthCategory');
      expect(dataset[0]).toHaveProperty('source', 'synthetic');
    });

    it('should generate transactions with Canadian merchants', () => {
      const dataset = service.generateSyntheticDataset(20); // Increase count for better chance
      
      const hasCanadianMerchants = dataset.some(tx => 
        tx.description.includes('TIM HORTONS') ||
        tx.description.includes('LOBLAWS') ||
        tx.description.includes('TTC') ||
        tx.description.includes('METRO') ||
        tx.description.includes('SOBEYS') ||
        tx.description.includes('BELL CANADA') ||
        tx.description.includes('ROGERS') ||
        tx.description.includes('HYDRO ONE')
      );
      
      expect(hasCanadianMerchants).toBe(true);
    });
  });

  describe('generateEdgeCaseDataset', () => {
    it('should generate edge case transactions', () => {
      const dataset = service.generateEdgeCaseDataset();

      expect(dataset.length).toBeGreaterThan(0);
      expect(dataset[0]).toHaveProperty('source', 'edge_case');
      
      // Check for specific edge cases
      const hasUnknownMerchant = dataset.some(tx => tx.description.includes('UNKNOWN'));
      const hasRefund = dataset.some(tx => tx.amount < 0);
      
      expect(hasUnknownMerchant).toBe(true);
      expect(hasRefund).toBe(true);
    });
  });

  describe('runValidation', () => {
    it('should run validation on a small dataset', async () => {
      // Mock dependencies
      categorizationService.categorizeTransactions.mockResolvedValue([
        {
          id: 'test-1',
          category: 'Dining Out',
          confidence: 0.9,
        },
      ]);

             performanceMonitor.getCacheStatistics.mockResolvedValue({
         hitRate: 20,
         totalRequests: 50,
         hitCount: 10,
         missCount: 40,
         avgLookupTime: 5,
       });

      // Generate a small test dataset
      const testDataset = [
        {
          id: 'test-1',
          description: 'TIM HORTONS #123',
          amount: 5.50,
          date: new Date().toISOString(),
          groundTruthCategory: 'Dining Out',
          source: 'synthetic' as const,
        },
      ];

      const report = await service.runValidation(testDataset, 'test');

      expect(report).toBeDefined();
      expect(report.totalTransactions).toBe(1);
      expect(report.overallAccuracy).toBe(100); // Perfect match
      expect(report.correctPredictions).toBe(1);
      expect(categorizationService.categorizeTransactions).toHaveBeenCalledTimes(1);
    });

    it('should handle categorization errors gracefully', async () => {
      // Mock a categorization error
      categorizationService.categorizeTransactions.mockRejectedValue(
        new Error('API Error')
      );

             performanceMonitor.getCacheStatistics.mockResolvedValue({
         hitRate: 0,
         totalRequests: 1,
         hitCount: 0,
         missCount: 1,
         avgLookupTime: 10,
       });

      const testDataset = [
        {
          id: 'test-error',
          description: 'ERROR TRANSACTION',
          amount: 10.00,
          date: new Date().toISOString(),
          groundTruthCategory: 'Other',
          source: 'synthetic' as const,
        },
      ];

      const report = await service.runValidation(testDataset, 'error-test');

      expect(report).toBeDefined();
      expect(report.totalTransactions).toBe(0); // No successful results
      expect(report.performanceMetrics.errorRate).toBeGreaterThan(0);
    });
  });
}); 