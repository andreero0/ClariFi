import { registerAs } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export interface GoogleCloudConfig {
  projectId: string;
  keyFilename?: string;
  apiEndpoint?: string;
  mock: boolean;
  quotaProjectId?: string;
  location: string;
  fallbackCredentials?: {
    client_email: string;
    private_key: string;
    project_id: string;
  };
}

export default registerAs(
  'googleCloud',
  (): GoogleCloudConfig => {
    const logger = new Logger('GoogleCloudConfig');
    
    // Environment variables for Google Cloud configuration
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'clarifi-prod';
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const mockMode = process.env.GOOGLE_CLOUD_MOCK === 'true' || 
                     process.env.NODE_ENV === 'development' && !keyFilename;
    const apiEndpoint = process.env.GOOGLE_CLOUD_API_ENDPOINT;
    const quotaProjectId = process.env.GOOGLE_CLOUD_QUOTA_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    // Fallback credentials for container/serverless environments
    const fallbackCredentials = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON 
      ? JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON)
      : undefined;

    const config: GoogleCloudConfig = {
      projectId,
      keyFilename,
      apiEndpoint,
      mock: mockMode,
      quotaProjectId,
      location,
      fallbackCredentials
    };

    // Log configuration (without sensitive data)
    logger.log(`Google Cloud Configuration initialized:`, {
      projectId,
      hasKeyFile: !!keyFilename,
      mockMode,
      hasApiEndpoint: !!apiEndpoint,
      hasQuotaProject: !!quotaProjectId,
      location,
      hasFallbackCredentials: !!fallbackCredentials
    });

    if (mockMode) {
      logger.warn('🔧 Google Cloud mock mode enabled - Vision API calls will be simulated');
    }

    return config;
  },
);

export const GOOGLE_CLOUD_CONFIG_KEY = 'googleCloud'; 