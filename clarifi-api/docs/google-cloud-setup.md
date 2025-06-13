# Google Cloud Vision API Setup Guide

This guide walks you through setting up Google Cloud Vision API for ClariFi's OCR functionality.

## Prerequisites

- Google Cloud Platform account
- Billing enabled on your Google Cloud account
- Node.js and npm installed
- ClariFi API project set up

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Enter project details:
   - **Project name**: `clarifi-ocr` (or your preferred name)
   - **Organization**: Select your organization (if applicable)
   - **Location**: Choose appropriate location
5. Click "Create"

## Step 2: Enable Billing

1. In the Google Cloud Console, navigate to **Billing**
2. Link a billing account to your project
3. **Important**: Google Vision API has a free tier of 1,000 units per month
4. Set up billing alerts to monitor usage:
   - Navigate to **Billing** → **Budgets & Alerts**
   - Create a budget for $10-20/month as a safety net
   - Set alerts at 50%, 90%, and 100% thresholds

## Step 3: Enable Vision API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API"
4. Click **Enable**
5. Wait for the API to be enabled (usually takes 1-2 minutes)

## Step 4: Create Service Account

1. Navigate to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Fill in service account details:
   - **Service account name**: `clarifi-ocr-service`
   - **Service account ID**: `clarifi-ocr-service` (auto-generated)
   - **Description**: `Service account for ClariFi OCR processing`
4. Click **Create and Continue**

## Step 5: Assign Permissions

1. In the service account creation wizard, assign roles:
   - **Cloud Vision AI Service Agent** (recommended minimum)
   - **Or AI Platform Developer** (if you need broader access)
2. Click **Continue**
3. Skip "Grant users access to this service account" (optional)
4. Click **Done**

## Step 6: Generate and Download Key

1. Find your newly created service account in the list
2. Click on the service account name
3. Navigate to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create**
7. The key file will automatically download
8. **IMPORTANT**: Keep this file secure and never commit it to version control

## Step 7: Configure Environment Variables

1. Rename the downloaded JSON key file to `google-cloud-key.json`
2. Place it in a secure location outside your project directory
3. Add environment variables to your `.env` file:

```bash
# Google Cloud Vision API Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_VISION_ENABLED=true

# Optional: Custom endpoint (for testing or regional optimization)
# GOOGLE_CLOUD_VISION_ENDPOINT=https://vision.googleapis.com/

# OCR Configuration
OCR_MAX_FILE_SIZE=50MB
OCR_MONTHLY_QUOTA=1000
OCR_COST_PER_UNIT=0.0015
OCR_ENABLE_PREPROCESSING=true
OCR_DEFAULT_LANGUAGE_HINTS=en,fr
```

4. Update your `.env.example` file (without sensitive values):

```bash
# Google Cloud Vision API Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_VISION_ENABLED=true
OCR_MAX_FILE_SIZE=50MB
OCR_MONTHLY_QUOTA=1000
OCR_COST_PER_UNIT=0.0015
OCR_ENABLE_PREPROCESSING=true
OCR_DEFAULT_LANGUAGE_HINTS=en,fr
```

## Step 8: Test the Setup

1. Restart your development server:
```bash
npm run start:dev
```

2. Test the health endpoint:
```bash
curl http://localhost:3000/ocr/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-04T18:40:00.000Z",
  "service": "OCR Service",
  "version": "1.0.0"
}
```

3. Test OCR processing with a simple image:
```bash
curl -X POST http://localhost:3000/ocr/upload \
  -F "file=@test-image.jpg" \
  -F "userId=test-user-id"
```

## Security Best Practices

### 1. Key Management
- **Never** commit the JSON key file to version control
- Store the key file outside your project directory
- Use environment variables to reference the key file path
- Consider using Google Cloud Secret Manager for production

### 2. Access Control
- Use the principle of least privilege
- Create separate service accounts for different environments (dev, staging, prod)
- Regularly rotate service account keys
- Monitor service account usage in Cloud Console

### 3. Cost Management
- Set up billing alerts and budgets
- Monitor API usage in Cloud Console
- Implement quota management in your application
- Use batch processing to optimize costs

## Environment-Specific Setup

### Development
```bash
GOOGLE_APPLICATION_CREDENTIALS=./keys/dev-google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=clarifi-dev
OCR_MONTHLY_QUOTA=500
```

### Staging
```bash
GOOGLE_APPLICATION_CREDENTIALS=./keys/staging-google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=clarifi-staging
OCR_MONTHLY_QUOTA=2000
```

### Production
```bash
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/prod-google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=clarifi-prod
OCR_MONTHLY_QUOTA=10000
```

## Troubleshooting

### Common Issues

1. **"Application Default Credentials not found"**
   - Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to the correct JSON file
   - Verify the file exists and is readable
   - Check file permissions

2. **"Permission denied"**
   - Verify the service account has the correct roles
   - Check that the Vision API is enabled
   - Confirm billing is set up

3. **"Quota exceeded"**
   - Check your monthly usage in Cloud Console
   - Verify quota limits in your application
   - Consider upgrading your billing plan

4. **"Invalid image format"**
   - Ensure image is in supported format (JPEG, PNG, PDF, etc.)
   - Check file size limits (50MB default)
   - Verify image preprocessing is working

### Debugging Commands

```bash
# Check if credentials are loaded correctly
node -e "console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)"

# Test Vision API access
gcloud auth activate-service-account --key-file=/path/to/key.json
gcloud projects list

# Check API quotas
gcloud services quota describe \
  --service=vision.googleapis.com \
  --consumer=projects/YOUR_PROJECT_ID
```

## Cost Optimization Tips

1. **Use image preprocessing** to improve OCR accuracy and reduce retry needs
2. **Implement caching** for repeated images
3. **Batch process** multiple images when possible
4. **Monitor usage patterns** to identify optimization opportunities
5. **Use appropriate image resolution** - higher isn't always better for costs
6. **Implement intelligent retry logic** with exponential backoff

## Monitoring and Alerts

Set up monitoring for:
- API request volume
- Error rates
- Response times
- Cost trends
- Quota usage

Use Google Cloud Monitoring to create dashboards and alerts for these metrics.

## Next Steps

After completing this setup:
1. Test with sample bank statements
2. Monitor initial usage and costs
3. Optimize preprocessing parameters
4. Set up automated monitoring
5. Configure production-ready error handling

## Support

For issues with this setup:
1. Check the troubleshooting section above
2. Review Google Cloud Vision API documentation
3. Monitor logs in Google Cloud Console
4. Contact the development team for application-specific issues 