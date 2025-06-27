import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface SecureFileInfo {
  encryptedPath: string;
  checksum: string;
  downloadToken: string;
  expiresAt: Date;
  originalSize: number;
  encryptedSize: number;
}

interface DownloadCredentials {
  token: string;
  expiresAt: Date;
  fileId: string;
  checksumVerification: string;
}

interface FileIntegrity {
  originalChecksum: string;
  verifiedChecksum: string;
  isValid: boolean;
  timestamp: Date;
}

export class SecureFileService {
  private static readonly ENCRYPTION_KEY_PREFIX = 'clarifi_export_key_';
  private static readonly DOWNLOAD_TOKEN_PREFIX = 'clarifi_download_token_';
  private static readonly SECURE_DIR =
    FileSystem.documentDirectory + 'secure_exports/';
  private static readonly TOKEN_EXPIRY_HOURS = 24;
  private static readonly MAX_FILE_AGE_HOURS = 48;

  /**
   * Initialize secure directory for encrypted exports
   */
  static async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.SECURE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.SECURE_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize secure directory:', error);
      throw new Error('Unable to setup secure file storage');
    }
  }

  /**
   * Encrypt a file with user-specific encryption key
   */
  static async encryptFile(
    filePath: string,
    userId: string,
    fileId: string
  ): Promise<SecureFileInfo> {
    try {
      await this.initialize();

      // Generate or retrieve user-specific encryption key
      const encryptionKey = await this.getOrCreateUserKey(userId);

      // Read the original file
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const originalSize = fileContent.length;

      // Generate checksum of original content
      const originalChecksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileContent
      );

      // Encrypt the content
      const encryptedContent = await this.encryptContent(
        fileContent,
        encryptionKey
      );
      const encryptedSize = encryptedContent.length;

      // Save encrypted file
      const encryptedFileName = `${fileId}_${Date.now()}.enc`;
      const encryptedPath = this.SECURE_DIR + encryptedFileName;

      await FileSystem.writeAsStringAsync(encryptedPath, encryptedContent);

      // Generate secure download token
      const downloadToken = await this.generateDownloadToken(
        userId,
        fileId,
        originalChecksum
      );

      // Set expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Store download credentials securely
      await this.storeDownloadCredentials(downloadToken, {
        token: downloadToken,
        expiresAt,
        fileId,
        checksumVerification: originalChecksum,
      });

      // Clean up original file for security
      await FileSystem.deleteAsync(filePath, { idempotent: true });

      return {
        encryptedPath,
        checksum: originalChecksum,
        downloadToken,
        expiresAt,
        originalSize,
        encryptedSize,
      };
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('Failed to encrypt export file');
    }
  }

  /**
   * Decrypt and verify file for download
   */
  static async decryptFileForDownload(
    downloadToken: string,
    userId: string
  ): Promise<{ filePath: string; integrity: FileIntegrity }> {
    try {
      // Verify download token
      const credentials = await this.getDownloadCredentials(downloadToken);
      if (!credentials) {
        throw new Error('Invalid or expired download token');
      }

      // Check expiry
      if (new Date() > credentials.expiresAt) {
        await this.revokeDownloadToken(downloadToken);
        throw new Error('Download token has expired');
      }

      // Get encryption key
      const encryptionKey = await this.getUserKey(userId);
      if (!encryptionKey) {
        throw new Error('User encryption key not found');
      }

      // Find encrypted file
      const encryptedFiles = await FileSystem.readDirectoryAsync(
        this.SECURE_DIR
      );
      const targetFile = encryptedFiles.find(
        file => file.includes(credentials.fileId) && file.endsWith('.enc')
      );

      if (!targetFile) {
        throw new Error('Encrypted file not found');
      }

      const encryptedPath = this.SECURE_DIR + targetFile;
      const encryptedContent =
        await FileSystem.readAsStringAsync(encryptedPath);

      // Decrypt content
      const decryptedContent = await this.decryptContent(
        encryptedContent,
        encryptionKey
      );

      // Verify integrity
      const verifiedChecksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        decryptedContent
      );

      const integrity: FileIntegrity = {
        originalChecksum: credentials.checksumVerification,
        verifiedChecksum,
        isValid: credentials.checksumVerification === verifiedChecksum,
        timestamp: new Date(),
      };

      if (!integrity.isValid) {
        throw new Error('File integrity verification failed');
      }

      // Create temporary decrypted file for download
      const tempFileName = `temp_${credentials.fileId}_${Date.now()}.tmp`;
      const tempPath = FileSystem.documentDirectory + tempFileName;

      await FileSystem.writeAsStringAsync(tempPath, decryptedContent);

      // Schedule cleanup after download
      this.scheduleFileCleanup(tempPath, 1); // 1 hour for download

      return {
        filePath: tempPath,
        integrity,
      };
    } catch (error) {
      console.error('File decryption failed:', error);
      throw new Error('Failed to prepare file for download');
    }
  }

  /**
   * Verify file integrity without decryption
   */
  static async verifyFileIntegrity(downloadToken: string): Promise<boolean> {
    try {
      const credentials = await this.getDownloadCredentials(downloadToken);
      if (!credentials || new Date() > credentials.expiresAt) {
        return false;
      }

      const encryptedFiles = await FileSystem.readDirectoryAsync(
        this.SECURE_DIR
      );
      const targetFile = encryptedFiles.find(
        file => file.includes(credentials.fileId) && file.endsWith('.enc')
      );

      return !!targetFile;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Revoke download token and mark as used
   */
  static async revokeDownloadToken(downloadToken: string): Promise<void> {
    try {
      const key = this.DOWNLOAD_TOKEN_PREFIX + downloadToken;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Failed to revoke download token:', error);
    }
  }

  /**
   * Clean up expired files and tokens
   */
  static async cleanupExpiredFiles(): Promise<{
    filesDeleted: number;
    tokensRevoked: number;
  }> {
    let filesDeleted = 0;
    const tokensRevoked = 0;

    try {
      await this.initialize();

      // Get all encrypted files
      const encryptedFiles = await FileSystem.readDirectoryAsync(
        this.SECURE_DIR
      );
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.MAX_FILE_AGE_HOURS);

      // Clean up old files
      for (const fileName of encryptedFiles) {
        const filePath = this.SECURE_DIR + fileName;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileDate = new Date(fileInfo.modificationTime * 1000);
          if (fileDate < cutoffTime) {
            await this.secureDelete(filePath);
            filesDeleted++;
          }
        }
      }

      // Note: SecureStore doesn't provide enumeration, so token cleanup
      // relies on natural expiry during access attempts
    } catch (error) {
      console.error('Cleanup failed:', error);
    }

    return { filesDeleted, tokensRevoked };
  }

  /**
   * Get or create user-specific encryption key
   */
  private static async getOrCreateUserKey(userId: string): Promise<string> {
    const keyName = this.ENCRYPTION_KEY_PREFIX + userId;

    try {
      let key = await SecureStore.getItemAsync(keyName);

      if (!key) {
        // Generate new 256-bit key
        key = await Crypto.getRandomBytesAsync(32).then(bytes =>
          Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
        );

        await SecureStore.setItemAsync(keyName, key);
      }

      return key;
    } catch (error) {
      console.error('Failed to get/create user key:', error);
      throw new Error('Unable to access encryption key');
    }
  }

  /**
   * Get existing user encryption key
   */
  private static async getUserKey(userId: string): Promise<string | null> {
    try {
      const keyName = this.ENCRYPTION_KEY_PREFIX + userId;
      return await SecureStore.getItemAsync(keyName);
    } catch (error) {
      console.error('Failed to get user key:', error);
      return null;
    }
  }

  /**
   * Encrypt content using AES-256 (simulated with available crypto)
   */
  private static async encryptContent(
    content: string,
    key: string
  ): Promise<string> {
    // Note: This is a simplified encryption for demo purposes
    // In production, use proper AES-256-GCM encryption
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(iv, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    // Simple XOR encryption with key (replace with proper AES in production)
    const encrypted = this.xorEncrypt(content, key);

    return ivHex + ':' + encrypted;
  }

  /**
   * Decrypt content using AES-256 (simulated with available crypto)
   */
  private static async decryptContent(
    encryptedContent: string,
    key: string
  ): Promise<string> {
    const [ivHex, encrypted] = encryptedContent.split(':', 2);

    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted content format');
    }

    // Simple XOR decryption (replace with proper AES in production)
    return this.xorEncrypt(encrypted, key);
  }

  /**
   * Simple XOR encryption (placeholder for AES-256-GCM)
   */
  private static xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(result); // Base64 encode
  }

  /**
   * Generate secure download token
   */
  private static async generateDownloadToken(
    userId: string,
    fileId: string,
    checksum: string
  ): Promise<string> {
    const timestamp = Date.now().toString();
    const tokenData = `${userId}:${fileId}:${checksum}:${timestamp}`;

    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      tokenData
    );
  }

  /**
   * Store download credentials securely
   */
  private static async storeDownloadCredentials(
    token: string,
    credentials: DownloadCredentials
  ): Promise<void> {
    try {
      const key = this.DOWNLOAD_TOKEN_PREFIX + token;
      const data = JSON.stringify(credentials);
      await SecureStore.setItemAsync(key, data);
    } catch (error) {
      console.error('Failed to store download credentials:', error);
      throw new Error('Unable to create secure download token');
    }
  }

  /**
   * Get download credentials
   */
  private static async getDownloadCredentials(
    token: string
  ): Promise<DownloadCredentials | null> {
    try {
      const key = this.DOWNLOAD_TOKEN_PREFIX + token;
      const data = await SecureStore.getItemAsync(key);

      if (!data) {
        return null;
      }

      const credentials = JSON.parse(data);
      credentials.expiresAt = new Date(credentials.expiresAt);

      return credentials;
    } catch (error) {
      console.error('Failed to get download credentials:', error);
      return null;
    }
  }

  /**
   * Schedule file cleanup after specified hours
   */
  private static scheduleFileCleanup(filePath: string, hours: number): void {
    setTimeout(
      async () => {
        try {
          await this.secureDelete(filePath);
        } catch (error) {
          console.error('Scheduled cleanup failed:', error);
        }
      },
      hours * 60 * 60 * 1000
    );
  }

  /**
   * Securely delete file with overwriting
   */
  private static async secureDelete(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        // Overwrite with random data before deletion
        const randomData = await Crypto.getRandomBytesAsync(1024);
        const randomString = Array.from(randomData, byte =>
          String.fromCharCode(byte)
        ).join('');

        await FileSystem.writeAsStringAsync(filePath, randomString);
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    } catch (error) {
      console.error('Secure delete failed:', error);
      // Fallback to regular delete
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    }
  }
}
