# Troubleshooting Guide

## Common Issues and Solutions

### 1. High Error Rate (>1%)

#### Symptoms
- Error rate above 1% threshold
- Failed categorization requests
- 500 Internal Server Error responses

#### Diagnostic Steps

**Check OpenAI API**
```bash
# Test API key validity
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check quota and usage
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/usage
```

**Check Redis Connection**
```bash
# Test Redis connectivity
redis-cli -u $REDIS_URL ping

# Check Redis memory usage
redis-cli -u $REDIS_URL info memory
```

**Check Database**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### 2. Low Accuracy (<85%)

#### Symptoms
- Categorization accuracy below 85% threshold
- Frequent user feedback corrections
- Poor category assignments

#### Solutions

1. **Update Rule Patterns**
   - Add new Canadian merchant patterns
   - Improve existing pattern matching
   - Increase rule confidence thresholds

2. **AI Model Optimization**
   - Adjust temperature settings
   - Review prompt engineering
   - Consider model upgrades

3. **Process Feedback**
   ```bash
   # Check recent feedback
   curl http://localhost:3000/categorization/feedback/history?limit=100
   
   # Process pending feedback
   curl -X POST http://localhost:3000/categorization/feedback/process-pending
   ```

### 3. High Costs (>$0.10 per statement)

#### Diagnostic Commands
```bash
# Check cost breakdown
curl http://localhost:3000/categorization/stats | jq '.averageCostPerStatement'

# Check cache hit rate
curl http://localhost:3000/categorization/cache/stats | jq '.hitRate'
```

#### Solutions

1. **Improve Caching**
   ```bash
   # Increase cache TTL (in environment)
   AI_SUGGESTED_CATEGORY_TTL_SECONDS=1209600  # 14 days instead of 7
   ```

2. **Optimize Rule Engine**
   - Add more high-confidence patterns
   - Reduce AI fallback frequency
   - Improve merchant name normalization

### 4. High Latency (P95 >500ms)

#### Performance Analysis
```bash
# Check current latency metrics
curl http://localhost:3000/categorization/stats | jq '.averageLatency'

# Monitor real-time performance
curl http://localhost:3000/categorization/monitoring/dashboard
```

#### Solutions

1. **Database Optimization**
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_transaction_feedback_user_id ON transaction_feedback(user_id);
   
   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM transaction_feedback WHERE user_id = 123;
   ```

2. **Redis Optimization**
   ```bash
   # Check Redis latency
   redis-cli -u $REDIS_URL --latency-history
   
   # Optimize configuration
   redis-cli -u $REDIS_URL CONFIG SET maxmemory-policy allkeys-lru
   ```

### 5. Cache Performance Issues

#### Low Cache Hit Rate (<30%)

**Check Cache Statistics**
```bash
curl http://localhost:3000/categorization/cache/stats
```

**Solutions**
1. Improve merchant name normalization
2. Increase TTL for stable patterns
3. Better key generation strategy

#### Cache Memory Issues
```bash
# Check Redis memory
redis-cli -u $REDIS_URL info memory

# Increase memory limit
redis-cli -u $REDIS_URL CONFIG SET maxmemory 4gb
```

### 6. Database Performance Issues

#### Connection Pool Exhaustion
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

**Solutions**
```bash
# Increase connection pool size
DATABASE_POOL_SIZE=50
DATABASE_TIMEOUT=60000
```

### 7. User Feedback System Issues

#### Feedback Not Processing
```sql
-- Check pending feedback
SELECT count(*) FROM transaction_feedback WHERE processing_status = 'pending';

-- Check failed feedback
SELECT * FROM transaction_feedback WHERE processing_status = 'failed' LIMIT 10;
```

**Solutions**
```bash
# Restart feedback processing
curl -X POST http://localhost:3000/categorization/feedback/process-pending

# Check service logs
docker-compose logs categorization-api | grep "FeedbackService"
```

## Diagnostic Tools

### Health Check Script
```bash
#!/bin/bash
echo "=== Health Check ==="

# Service health
curl -s http://localhost:3000/categorization/health | jq '.'

# Database
psql $DATABASE_URL -c "SELECT 'Database OK';" 2>/dev/null || echo "Database failed"

# Redis
redis-cli -u $REDIS_URL ping 2>/dev/null || echo "Redis failed"

# Performance metrics
curl -s http://localhost:3000/categorization/stats | jq '{accuracy: .averageAccuracy, cost: .averageCostPerStatement}'
```

### Log Analysis
```bash
# Check error patterns
docker-compose logs categorization-api | grep ERROR | tail -20

# Check AI API calls
docker-compose logs categorization-api | grep "OpenAI" | tail -20

# Check cache performance
docker-compose logs categorization-api | grep "Cache" | tail -20
```

## Emergency Procedures

### Service Recovery
```bash
# Restart services
docker-compose restart categorization-api

# Clear corrupted cache
redis-cli -u $REDIS_URL FLUSHDB

# Reset database connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'clarifi_db';"
```

### Rollback Procedures
```bash
# Application rollback
docker-compose down
docker-compose up -d

# Database rollback
npx prisma migrate reset --force
npx prisma migrate deploy --to <previous-migration>
```

## Contact Information

- **Development Team**: development@clarifi.ca
- **DevOps Team**: devops@clarifi.ca
- **Emergency**: +1-800-CLARIFI

## Escalation Matrix

1. **Level 1**: Service degradation (>5min) → Development Team
2. **Level 2**: Service outage (>15min) → DevOps + Management
3. **Level 3**: Data integrity issues → All teams + Emergency response 