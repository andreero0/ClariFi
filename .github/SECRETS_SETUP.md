# GitHub Secrets Setup Guide

This document outlines the GitHub secrets that should be configured for the ClariFi project's CI/CD workflows.

## Required Secrets

To fully test the application in CI/CD, you'll need to configure the following secrets in your GitHub repository settings:

### Database & Infrastructure

- `DATABASE_URL` - PostgreSQL connection string for testing
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Cache & Storage

- `UPSTASH_REDIS_REST_URL` - Redis URL for caching
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token

### AI Services

- `ANTHROPIC_API_KEY` - Claude API key for AI features
- `OPENAI_API_KEY` - OpenAI API key (backup)
- `GOOGLE_CLOUD_API_KEY` - Google Vision API for OCR

### Authentication & Security

- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - 32-character encryption key

### Monitoring

- `SENTRY_DSN` - Sentry error tracking DSN

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact name and value

## Optional: Enhanced CI Workflows

Currently, the workflows run basic linting and building. To enable full integration testing with these services, you would need to update the workflow files to use these secrets.

## Security Note

Never commit actual secret values to the repository. Always use GitHub secrets or environment variables for sensitive data.
