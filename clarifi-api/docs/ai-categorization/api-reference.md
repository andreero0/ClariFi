# API Reference

## Overview

The AI-Powered Transaction Categorization API provides RESTful endpoints for categorizing financial transactions, managing user feedback, monitoring system performance, and accessing analytics. All endpoints require authentication and return JSON responses.

## Base URL
```
Production: https://api.clarifi.ca/categorization
Development: http://localhost:3000/categorization
```

## Authentication

All API endpoints require JWT authentication via the Authorization header:
```http
Authorization: Bearer <jwt_token>
```

## Core Categorization Endpoints

### 1. Single Transaction Categorization

**Endpoint**: `POST /single`

**Description**: Categorize a single financial transaction using the hybrid AI + rule-based system.

**Request Body**:
```typescript
{
  id: string;           // Unique transaction identifier
  description: string;  // Transaction description/merchant name
  amount: number;       // Transaction amount (positive for debits)
  date: string;         // ISO 8601 date string
}
```

**Example Request**:
```bash
curl -X POST https://api.clarifi.ca/categorization/single \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tx_123456",
    "description": "TIM HORTONS #1234 TORONTO ON",
    "amount": 5.50,
    "date": "2025-06-04T10:30:00Z"
  }'
```

**Response**:
```typescript
{
  id: string;           // Transaction ID
  category: string;     // Categorized category
  confidence?: number;  // Confidence score (0-1)
  rawApiResponse?: any; // Raw AI response (debug mode)
}
```

**Example Response**:
```json
{
  "id": "tx_123456",
  "category": "Dining Out",
  "confidence": 0.92
}
```

**Status Codes**:
- `200 OK`: Successful categorization
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: System error

### 2. Batch Transaction Categorization

**Endpoint**: `POST /batch`

**Description**: Categorize multiple transactions in a single request (up to 100 transactions).

**Request Body**:
```typescript
{
  transactions: TransactionForCategorizationDto[]; // Array of transactions
}
```

**Example Request**:
```bash
curl -X POST https://api.clarifi.ca/categorization/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "id": "tx_001",
        "description": "LOBLAWS #123",
        "amount": 45.67,
        "date": "2025-06-04T09:00:00Z"
      },
      {
        "id": "tx_002", 
        "description": "TTC MONTHLY PASS",
        "amount": 156.00,
        "date": "2025-06-04T08:00:00Z"
      }
    ]
  }'
```

**Response**:
```typescript
{
  results: CategorizedTransactionDto[];
  metadata: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    processingTimeMs: number;
  };
}
```

**Example Response**:
```json
{
  "results": [
    {
      "id": "tx_001",
      "category": "Groceries",
      "confidence": 0.95
    },
    {
      "id": "tx_002",
      "category": "Transportation", 
      "confidence": 0.88
    }
  ],
  "metadata": {
    "totalProcessed": 2,
    "successCount": 2,
    "errorCount": 0,
    "processingTimeMs": 245
  }
}
```

## User Feedback Endpoints

### 3. Submit Feedback

**Endpoint**: `PUT /feedback`

**Description**: Submit user correction for a miscategorized transaction to improve the system.

**Request Body**:
```typescript
{
  transactionId: string;        // Original transaction ID
  originalCategory: string;     // System-assigned category
  correctedCategory: string;    // User-corrected category
  confidenceRating?: number;    // User confidence (1-5)
  notes?: string;              // Optional feedback notes
}
```

**Example Request**:
```bash
curl -X PUT https://api.clarifi.ca/categorization/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx_123456",
    "originalCategory": "Shopping",
    "correctedCategory": "Groceries",
    "confidenceRating": 5,
    "notes": "This is clearly a grocery store purchase"
  }'
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  feedbackId: string;
  learningApplied: boolean;
}
```

### 4. Bulk Feedback Submission

**Endpoint**: `POST /feedback/bulk`

**Description**: Submit multiple feedback corrections in a single request.

**Request Body**:
```typescript
{
  feedbacks: UserFeedbackDto[];
}
```

**Response**:
```typescript
{
  results: BulkFeedbackResponseDto[];
  metadata: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  };
}
```

### 5. Feedback History

**Endpoint**: `GET /feedback/history`

**Description**: Retrieve user's feedback history with pagination.

**Query Parameters**:
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 20, max: 100)
- `category?: string` - Filter by category
- `startDate?: string` - Filter from date (ISO 8601)
- `endDate?: string` - Filter to date (ISO 8601)

**Example Request**:
```bash
curl -X GET "https://api.clarifi.ca/categorization/feedback/history?page=1&limit=10&category=Groceries" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```typescript
{
  feedbacks: FeedbackHistoryDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## System Information Endpoints

### 6. Available Categories

**Endpoint**: `GET /categories`

**Description**: Get list of all available transaction categories.

**Example Request**:
```bash
curl -X GET https://api.clarifi.ca/categorization/categories \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "categories": [
    "Groceries",
    "Transportation", 
    "Dining Out",
    "Utilities",
    "Shopping",
    "Health & Wellness",
    "Entertainment",
    "Services",
    "Housing",
    "Income",
    "Transfers",
    "Other"
  ]
}
```

### 7. Category Validation

**Endpoint**: `POST /validate-category`

**Description**: Validate if a category name is supported by the system.

**Request Body**:
```typescript
{
  category: string;
}
```

**Response**:
```typescript
{
  isValid: boolean;
  category: string;
  suggestions?: string[]; // Alternative categories if invalid
}
```

## Performance & Monitoring Endpoints

### 8. System Statistics

**Endpoint**: `GET /stats`

**Description**: Get system performance statistics and metrics.

**Query Parameters**:
- `period?: string` - Time period: 'hourly', 'daily', 'weekly', 'monthly' (default: 'daily')
- `startDate?: string` - Start date for custom period
- `endDate?: string` - End date for custom period

**Example Request**:
```bash
curl -X GET "https://api.clarifi.ca/categorization/stats?period=daily" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```typescript
{
  period: string;
  totalTransactions: number;
  averageAccuracy: number;
  averageCostPerStatement: number;
  cacheHitRate: number;
  averageLatency: number;
  errorRate: number;
  categoryBreakdown: {
    [category: string]: {
      count: number;
      accuracy: number;
    };
  };
  performanceTrends: {
    date: string;
    accuracy: number;
    cost: number;
    latency: number;
  }[];
}
```

### 9. Cache Statistics

**Endpoint**: `GET /cache/stats`

**Description**: Get detailed cache performance metrics.

**Response**:
```typescript
{
  hitRate: number;           // Cache hit rate percentage
  totalRequests: number;     // Total cache requests
  hitCount: number;          // Cache hits
  missCount: number;         // Cache misses
  avgLookupTime: number;     // Average lookup time in ms
  memoryUsage: {
    used: number;            // Used memory in bytes
    total: number;           // Total allocated memory
    percentage: number;      // Usage percentage
  };
  topMerchants: {
    merchant: string;
    hitCount: number;
    category: string;
  }[];
}
```

### 10. Health Check

**Endpoint**: `GET /health`

**Description**: Check system health and component status.

**Response**:
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    aiService: 'healthy' | 'unhealthy';
    ruleEngine: 'healthy' | 'unhealthy';
  };
  metrics: {
    uptime: number;           // Uptime in seconds
    memoryUsage: number;      // Memory usage percentage
    cpuUsage: number;         // CPU usage percentage
  };
}
```

## Monitoring & Alerting Endpoints

### 11. Monitoring Dashboard

**Endpoint**: `GET /monitoring/dashboard`

**Description**: Get real-time monitoring dashboard data.

**Response**:
```typescript
{
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  currentMetrics: {
    accuracy: number;
    costPerStatement: number;
    errorRate: number;
    cacheHitRate: number;
    avgLatency: number;
  };
  activeAlerts: AlertDto[];
  recentActivity: {
    transactionsProcessed: number;
    feedbackReceived: number;
    errorsOccurred: number;
  };
  performanceTrends: {
    timestamp: string;
    accuracy: number;
    latency: number;
    cost: number;
  }[];
}
```

### 12. Active Alerts

**Endpoint**: `GET /monitoring/alerts`

**Description**: Get list of active system alerts.

**Query Parameters**:
- `severity?: string` - Filter by severity: 'low', 'medium', 'high', 'critical'
- `status?: string` - Filter by status: 'active', 'resolved', 'suppressed'

**Response**:
```typescript
{
  alerts: {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    status: 'active' | 'resolved' | 'suppressed';
    metadata: any;
  }[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
```

### 13. Resolve Alert

**Endpoint**: `POST /monitoring/alerts/:id/resolve`

**Description**: Manually resolve an active alert.

**Request Body**:
```typescript
{
  resolution: string;       // Resolution description
  resolvedBy: string;       // User who resolved the alert
}
```

## Validation & Testing Endpoints

### 14. Run Validation

**Endpoint**: `POST /validation/run`

**Description**: Execute end-to-end validation testing with synthetic data.

**Query Parameters**:
- `scenario?: string` - Test scenario: 'baseline', 'cost', 'edge', 'full' (default: 'baseline')
- `count?: number` - Number of test transactions (default: 1000, max: 10000)

**Response**:
```typescript
{
  scenario: string;
  overallAccuracy: number;
  totalTransactions: number;
  averageCostPerStatement: number;
  cacheHitRate: number;
  averageLatency: number;
  errorRate: number;
  categoryAccuracy: {
    [category: string]: number;
  };
  productionReady: boolean;
  recommendations: string[];
}
```

### 15. Generate Test Dataset

**Endpoint**: `GET /validation/dataset/synthetic`

**Description**: Generate synthetic Canadian transaction dataset for testing.

**Query Parameters**:
- `count?: number` - Number of transactions to generate (default: 100, max: 10000)
- `categories?: string[]` - Specific categories to include

**Response**:
```typescript
{
  transactions: {
    id: string;
    description: string;
    amount: number;
    date: string;
    groundTruthCategory: string;
    source: 'synthetic';
  }[];
  metadata: {
    totalGenerated: number;
    categoryDistribution: {
      [category: string]: number;
    };
  };
}
```

## Error Handling

### Standard Error Response Format
```typescript
{
  error: {
    code: string;           // Error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error details
    timestamp: string;      // Error timestamp
    requestId: string;      // Request correlation ID
  };
}
```

### Common Error Codes
- `INVALID_INPUT`: Request validation failed
- `UNAUTHORIZED`: Authentication required or invalid
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `AI_SERVICE_ERROR`: AI categorization service error
- `CACHE_ERROR`: Redis cache error
- `DATABASE_ERROR`: Database operation error
- `INTERNAL_ERROR`: Unexpected system error

## Rate Limiting

### Default Limits
- **Single Transaction**: 1000 requests/hour per user
- **Batch Processing**: 100 requests/hour per user
- **Feedback Submission**: 500 requests/hour per user
- **Monitoring Endpoints**: 200 requests/hour per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1625097600
```

## SDK Examples

### Node.js/TypeScript
```typescript
import { CategorizationClient } from '@clarifi/categorization-sdk';

const client = new CategorizationClient({
  baseUrl: 'https://api.clarifi.ca',
  apiKey: 'your-api-key'
});

// Single transaction
const result = await client.categorize({
  id: 'tx_123',
  description: 'TIM HORTONS #1234',
  amount: 5.50,
  date: new Date().toISOString()
});

// Batch processing
const batchResult = await client.categorizeBatch({
  transactions: [/* array of transactions */]
});

// Submit feedback
await client.submitFeedback({
  transactionId: 'tx_123',
  originalCategory: 'Shopping',
  correctedCategory: 'Groceries'
});
```

### Python
```python
from clarifi_categorization import CategorizationClient

client = CategorizationClient(
    base_url='https://api.clarifi.ca',
    api_key='your-api-key'
)

# Single transaction
result = client.categorize({
    'id': 'tx_123',
    'description': 'TIM HORTONS #1234',
    'amount': 5.50,
    'date': '2025-06-04T10:30:00Z'
})

# Submit feedback
client.submit_feedback({
    'transaction_id': 'tx_123',
    'original_category': 'Shopping',
    'corrected_category': 'Groceries'
})
```

## Webhook Integration

### Feedback Processing Webhooks
Configure webhooks to receive notifications when feedback is processed:

**Webhook URL**: Configure in system settings
**Method**: POST
**Headers**: 
- `X-Clarifi-Signature`: HMAC signature for verification
- `Content-Type`: application/json

**Payload**:
```typescript
{
  event: 'feedback.processed';
  timestamp: string;
  data: {
    feedbackId: string;
    transactionId: string;
    userId: string;
    originalCategory: string;
    correctedCategory: string;
    learningApplied: boolean;
    accuracyImprovement?: number;
  };
}
``` 