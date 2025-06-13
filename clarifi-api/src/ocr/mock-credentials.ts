import { Logger } from '@nestjs/common';

/**
 * Mock Google Cloud credentials for development and testing
 * This allows the OCR service to start without actual Google Cloud setup
 */
export interface MockCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

export class MockCredentialsManager {
  private static readonly logger = new Logger(MockCredentialsManager.name);

  /**
   * Generate mock credentials for development
   */
  static generateMockCredentials(): MockCredentials {
    return {
      type: 'service_account',
      project_id: 'clarifi-dev-mock',
      private_key_id: 'mock-key-id-12345',
      private_key: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_DEVELOPMENT\n-----END PRIVATE KEY-----\n',
      client_email: 'clarifi-ocr-service@clarifi-dev-mock.iam.gserviceaccount.com',
      client_id: '123456789012345678901',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/clarifi-ocr-service%40clarifi-dev-mock.iam.gserviceaccount.com',
      universe_domain: 'googleapis.com'
    };
  }

  /**
   * Setup mock credentials for development environment
   */
  static setupMockCredentials(): string {
    const mockCreds = this.generateMockCredentials();
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!credentialsPath && process.env.NODE_ENV === 'development') {
      this.logger.warn(
        '🔧 Development Mode: No Google Cloud credentials found. ' +
        'OCR service will run in mock mode for development. ' +
        'See docs/google-cloud-setup.md for production setup.'
      );

      // Create a temporary credentials file for development
      const fs = require('fs');
      const path = require('path');
      const tmpDir = path.join(process.cwd(), 'tmp');
      
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const mockCredentialsPath = path.join(tmpDir, 'mock-google-credentials.json');
      fs.writeFileSync(mockCredentialsPath, JSON.stringify(mockCreds, null, 2));

      // Set environment variable to point to mock credentials
      process.env.GOOGLE_APPLICATION_CREDENTIALS = mockCredentialsPath;
      process.env.GOOGLE_CLOUD_PROJECT_ID = mockCreds.project_id;

      this.logger.log(`📁 Mock credentials created at: ${mockCredentialsPath}`);
      return mockCredentialsPath;
    }

    return credentialsPath || '';
  }

  /**
   * Check if we're running with mock credentials
   */
  static isMockMode(): boolean {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    return projectId === 'clarifi-dev-mock' || (projectId?.includes('mock') ?? false);
  }

  /**
   * Get environment info for debugging
   */
  static getEnvironmentInfo() {
    return {
      isMockMode: this.isMockMode(),
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      nodeEnv: process.env.NODE_ENV,
      visionEnabled: process.env.GOOGLE_CLOUD_VISION_ENABLED
    };
  }

  /**
   * Clean up mock credentials file
   */
  static cleanupMockCredentials(): void {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (credentialsPath && credentialsPath.includes('mock-google-credentials.json')) {
      const fs = require('fs');
      
      try {
        if (fs.existsSync(credentialsPath)) {
          fs.unlinkSync(credentialsPath);
          this.logger.log('🧹 Mock credentials file cleaned up');
        }
      } catch (error) {
        this.logger.warn('Failed to clean up mock credentials file', error);
      }
    }
  }
}

/**
 * Mock OCR response for development testing
 */
export class MockOcrResponse {
  static generateMockResponse(imageData: string): any {
    const mockText = `
ROYAL BANK OF CANADA
ACCOUNT STATEMENT

Account Number: ****1234
Statement Period: Jan 1, 2025 - Jan 31, 2025

Date        Description                     Amount      Balance
2025-01-01  OPENING BALANCE                            $2,450.00
2025-01-02  GROCERY STORE #123             -$85.67     $2,364.33
2025-01-03  PAYROLL DEPOSIT               +$2,500.00   $4,864.33
2025-01-05  COFFEE SHOP                    -$4.50      $4,859.83
2025-01-07  RENT PAYMENT                  -$1,200.00   $3,659.83
2025-01-10  UTILITY PAYMENT                -$125.00    $3,534.83
2025-01-15  PAYROLL DEPOSIT               +$2,500.00   $6,034.83
2025-01-20  RESTAURANT                     -$45.75     $5,989.08
2025-01-25  ATM WITHDRAWAL                 -$100.00    $5,889.08
2025-01-31  CLOSING BALANCE                            $5,889.08

Total Credits: $5,000.00
Total Debits: $1,560.92
    `.trim();

    return {
      textAnnotations: [
        {
          description: mockText,
          boundingPoly: {
            vertices: [
              { x: 0, y: 0 },
              { x: 1000, y: 0 },
              { x: 1000, y: 1400 },
              { x: 0, y: 1400 }
            ]
          }
        }
      ],
      fullTextAnnotation: {
        text: mockText,
        pages: [
          {
            blocks: [
              {
                paragraphs: [
                  {
                    words: [
                      {
                        symbols: [
                          { text: 'ROYAL', confidence: 0.95 },
                          { text: ' ', confidence: 0.95 },
                          { text: 'BANK', confidence: 0.95 }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }
}

// Initialize mock credentials on module load for development
if (process.env.NODE_ENV === 'development') {
  MockCredentialsManager.setupMockCredentials();
} 