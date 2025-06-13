# Environment Configuration for ClariFi API

This document outlines the environment variables and configuration required for the ClariFi API, particularly for Google Cloud OCR integration.

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/clarifi_db"
```

### Supabase Configuration
```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Redis Configuration
```bash
UPSTASH_REDIS_REST_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_TOKEN=""
```

### Google Cloud Configuration for OCR
```bash
# Primary configuration
GOOGLE_CLOUD_PROJECT_ID="clarifi-prod"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Optional configurations
GOOGLE_CLOUD_MOCK="false"                    # Set to "true" for development mode
GOOGLE_CLOUD_API_ENDPOINT=""                 # Custom API endpoint if needed
GOOGLE_CLOUD_QUOTA_PROJECT_ID=""             # For quota tracking
GOOGLE_CLOUD_LOCATION="us-central1"          # Default region

# Alternative for serverless environments (instead of GOOGLE_APPLICATION_CREDENTIALS)
# GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"..."}'
```

### Application Configuration
```bash
NODE_ENV="development"
PORT="3000"
JWT_SECRET="your-jwt-secret"
RATE_LIMIT_TTL="60"
RATE_LIMIT_MAX="100"
```

## Google Cloud Setup

### 1. Service Account Creation
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Fill in details:
   - Name: `clarifi-ocr-service`
   - Description: `Service account for ClariFi OCR operations`
6. Grant the following roles:
   - `Cloud Vision AI Service Agent`
   - `Cloud Vision API Editor`
7. Create and download JSON key file

### 2. Enable APIs
1. Navigate to "APIs & Services" > "Library"
2. Search and enable:
   - `Cloud Vision API`
   - `Cloud Resource Manager API`

### 3. Authentication Setup

#### Option A: Service Account Key File (Recommended for Development)
1. Download the JSON key file from step 1
2. Place it in a secure location (e.g., `~/gcp-keys/clarifi-ocr-key.json`)
3. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/gcp-keys/clarifi-ocr-key.json"
   ```

#### Option B: Service Account JSON in Environment (Serverless)
1. Copy the entire JSON content from the key file
2. Set as environment variable:
   ```bash
   export GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

### 4. Verification
Test your setup by running the health check endpoint:
```bash
curl http://localhost:3000/ocr/health
```

## Development Mode

For development without actual Google Cloud credentials:
```bash
export GOOGLE_CLOUD_MOCK="true"
export NODE_ENV="development"
```

This will enable mock responses for OCR operations.

## Security Best Practices

1. **Never commit service account keys to version control**
2. **Use environment-specific credentials**
3. **Rotate service account keys regularly**
4. **Use IAM roles with minimal required permissions**
5. **Monitor API usage and costs**

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
   - Check service account has proper permissions
   - Ensure APIs are enabled

2. **Quota Exceeded**
   - Check Google Cloud Console for quota limits
   - Monitor usage in the ClariFi dashboard
   - Consider upgrading your Google Cloud plan

3. **Mock Mode Not Working**
   - Verify `GOOGLE_CLOUD_MOCK="true"` is set
   - Check `NODE_ENV` is set to `development`

For additional help, refer to the [Google Cloud setup guide](./google-cloud-setup.md). 