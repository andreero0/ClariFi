import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CategorizationModule } from '../src/categorization/categorization.module';

describe('Categorization (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CategorizationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/categorization (GET)', () => {
    it('should return available categories', () => {
      return request(app.getHttpServer())
        .get('/categorization/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body).toContain('Groceries');
          expect(res.body).toContain('Transportation');
          expect(res.body).toContain('Dining Out');
        });
    });
  });

  describe('/categorization/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/categorization/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('components');
        });
    });
  });

  describe('/categorization/single (POST)', () => {
    it('should categorize a single transaction', () => {
      const transaction = {
        id: 'test-txn-1',
        description: 'TIM HORTONS #123 TORONTO ON',
        amount: 5.50,
        date: '2025-01-01T10:00:00Z'
      };

      return request(app.getHttpServer())
        .post('/categorization/single')
        .send(transaction)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('transactionId');
          expect(res.body).toHaveProperty('category');
          expect(res.body).toHaveProperty('confidence');
          expect(res.body).toHaveProperty('source');
          expect(res.body.transactionId).toBe(transaction.id);
          expect(typeof res.body.category).toBe('string');
          expect(typeof res.body.confidence).toBe('number');
          expect(res.body.confidence).toBeGreaterThanOrEqual(0);
          expect(res.body.confidence).toBeLessThanOrEqual(100);
        });
    });

    it('should handle invalid transaction data', () => {
      const invalidTransaction = {
        id: '',
        description: '',
        amount: 'invalid',
        date: 'invalid-date'
      };

      return request(app.getHttpServer())
        .post('/categorization/single')
        .send(invalidTransaction)
        .expect(400);
    });
  });

  describe('/categorization/batch (POST)', () => {
    it('should categorize multiple transactions', () => {
      const batchRequest = {
        transactions: [
          {
            id: 'test-txn-1',
            description: 'TIM HORTONS #123 TORONTO ON',
            amount: 5.50,
            date: '2025-01-01T10:00:00Z'
          },
          {
            id: 'test-txn-2',
            description: 'LOBLAWS SUPERMARKET',
            amount: 45.67,
            date: '2025-01-01T11:00:00Z'
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/categorization/batch')
        .send(batchRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('results');
          expect(res.body).toHaveProperty('metadata');
          expect(Array.isArray(res.body.results)).toBe(true);
          expect(res.body.results.length).toBe(2);
          expect(res.body.metadata).toHaveProperty('totalTransactions');
          expect(res.body.metadata).toHaveProperty('successfulCategorizations');
          expect(res.body.metadata.totalTransactions).toBe(2);
        });
    });

    it('should handle empty batch request', () => {
      const emptyBatch = {
        transactions: []
      };

      return request(app.getHttpServer())
        .post('/categorization/batch')
        .send(emptyBatch)
        .expect(400);
    });
  });

  describe('/categorization/stats (GET)', () => {
    it('should return categorization statistics', () => {
      return request(app.getHttpServer())
        .get('/categorization/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalCategorizations');
          expect(res.body).toHaveProperty('cacheHitRate');
          expect(res.body).toHaveProperty('averageProcessingTimeMs');
          expect(typeof res.body.totalCategorizations).toBe('number');
          expect(typeof res.body.cacheHitRate).toBe('number');
          expect(typeof res.body.averageProcessingTimeMs).toBe('number');
        });
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/categorization/single')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle missing required fields', () => {
      const incompleteTransaction = {
        id: 'test-txn-1'
        // missing description, amount, date
      };

      return request(app.getHttpServer())
        .post('/categorization/single')
        .send(incompleteTransaction)
        .expect(400);
    });
  });
}); 