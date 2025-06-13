import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { GoogleAuth } from 'google-auth-library';
import { GoogleCloudConfig } from './google-cloud.config';

export interface AuthHealthCheck {
  isAuthenticated: boolean;
  hasValidCredentials: boolean;
  canAccessVisionAPI: boolean;
  projectId?: string;
  serviceAccount?: string;
  error?: string;
  timestamp: string;
}

export interface CredentialInfo {
  type: 'service_account' | 'user' | 'application_default' | 'mock';
  projectId?: string;
  clientEmail?: string;
  hasPrivateKey: boolean;
}

@Injectable()
export class GoogleCloudAuthService implements OnModuleInit {
  private readonly logger = new Logger(GoogleCloudAuthService.name);
  private auth: GoogleAuth;
  private config: GoogleCloudConfig;
  private lastHealthCheck?: AuthHealthCheck;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<GoogleCloudConfig>('googleCloud')!;
  }

  async onModuleInit() {
    await this.initializeAuth();
    await this.performHealthCheck();
  }

  /**
   * Initialize Google Cloud authentication
   */
  private async initializeAuth(): Promise<void> {
    try {
      if (this.config.mock) {
        this.logger.warn('🔧 Authentication initialized in mock mode');
        return;
      }

      // Initialize GoogleAuth with configuration
      const authConfig: any = {
        projectId: this.config.projectId,
      };

      // Use key file if provided
      if (this.config.keyFilename) {
        authConfig.keyFilename = this.config.keyFilename;
      }

      // Use fallback credentials if provided (for serverless environments)
      if (this.config.fallbackCredentials) {
        authConfig.credentials = this.config.fallbackCredentials;
      }

      // Set quota project if provided
      if (this.config.quotaProjectId) {
        authConfig.quotaProjectId = this.config.quotaProjectId;
      }

      this.auth = new GoogleAuth({
        ...authConfig,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });

      this.logger.log('Google Cloud authentication initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Cloud authentication', error);
      
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
    }
  }

  /**
   * Get authenticated Vision API client
   */
  async getVisionClient(): Promise<ImageAnnotatorClient> {
    if (this.config.mock) {
      // Return empty object for mock mode
      return {} as ImageAnnotatorClient;
    }

    try {
      const clientOptions: any = {
        projectId: this.config.projectId,
      };

      // Use key file if provided
      if (this.config.keyFilename) {
        clientOptions.keyFilename = this.config.keyFilename;
      }

      // Use fallback credentials if provided
      if (this.config.fallbackCredentials) {
        clientOptions.credentials = this.config.fallbackCredentials;
      }

      // Use custom API endpoint if provided
      if (this.config.apiEndpoint) {
        clientOptions.apiEndpoint = this.config.apiEndpoint;
      }

      return new ImageAnnotatorClient(clientOptions);
    } catch (error) {
      this.logger.error('Failed to create Vision API client', error);
      throw error;
    }
  }

  /**
   * Validate current credentials
   */
  async validateCredentials(): Promise<CredentialInfo> {
    if (this.config.mock) {
      return {
        type: 'mock',
        hasPrivateKey: false,
        projectId: this.config.projectId
      };
    }

    try {
      const client = await this.auth.getClient();
      const credentials = await this.auth.getCredentials();
      
      // Determine credential type
      let type: CredentialInfo['type'] = 'application_default';
      if (this.config.keyFilename || this.config.fallbackCredentials) {
        type = 'service_account';
      }

      const info: CredentialInfo = {
        type,
        projectId: await this.auth.getProjectId(),
        clientEmail: credentials.client_email,
        hasPrivateKey: !!credentials.private_key
      };

      this.logger.log('Credentials validated successfully', {
        type: info.type,
        projectId: info.projectId,
        clientEmail: info.clientEmail,
        hasPrivateKey: info.hasPrivateKey
      });

      return info;
    } catch (error) {
      this.logger.error('Failed to validate credentials', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(forceRefresh = false): Promise<AuthHealthCheck> {
    if (!forceRefresh && this.lastHealthCheck && 
        Date.now() - new Date(this.lastHealthCheck.timestamp).getTime() < 60000) {
      return this.lastHealthCheck;
    }

    const timestamp = new Date().toISOString();
    
    if (this.config.mock) {
      this.lastHealthCheck = {
        isAuthenticated: true,
        hasValidCredentials: true,
        canAccessVisionAPI: true,
        projectId: this.config.projectId,
        serviceAccount: 'mock-service-account@mock.iam.gserviceaccount.com',
        timestamp
      };
      return this.lastHealthCheck;
    }

    try {
      // Test credential validation
      const credentialInfo = await this.validateCredentials();

      // Test Vision API access with a minimal request
      const visionClient = await this.getVisionClient();
      
      // Simple test to check if we can make authenticated requests
      // Using a minimal feature set to avoid unnecessary costs
      const testResponse = await visionClient.annotateImage({
        image: {
          content: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
        },
        features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
      });

      this.lastHealthCheck = {
        isAuthenticated: true,
        hasValidCredentials: true,
        canAccessVisionAPI: true,
        projectId: credentialInfo.projectId,
        serviceAccount: credentialInfo.clientEmail,
        timestamp
      };

      this.logger.log('Health check passed successfully');
    } catch (error) {
      this.logger.error('Health check failed', error);
      
      this.lastHealthCheck = {
        isAuthenticated: false,
        hasValidCredentials: false,
        canAccessVisionAPI: false,
        error: error.message,
        timestamp
      };
    }

    return this.lastHealthCheck;
  }

  /**
   * Get the latest health check result
   */
  getLatestHealthCheck(): AuthHealthCheck | undefined {
    return this.lastHealthCheck;
  }

  /**
   * Check if authentication is properly configured
   */
  isConfigured(): boolean {
    return this.config.mock || 
           !!this.config.keyFilename || 
           !!this.config.fallbackCredentials ||
           !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  /**
   * Get configuration summary (for debugging)
   */
  getConfigSummary(): any {
    return {
      projectId: this.config.projectId,
      hasKeyFile: !!this.config.keyFilename,
      mock: this.config.mock,
      location: this.config.location
    };
  }

  /**
   * Test authentication with retry logic
   */
  async testAuthenticationWithRetry(maxRetries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const healthCheck = await this.performHealthCheck(true);
        if (healthCheck.isAuthenticated && healthCheck.canAccessVisionAPI) {
          return true;
        }
      } catch (error) {
        this.logger.warn(`Authentication test attempt ${attempt} failed`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return false;
  }
} 