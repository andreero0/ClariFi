import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(
    fileBuffer: Buffer,
    filePath: string, // e.g., 'user-id/filename.png'
    bucketName: string,
    mimetype: string,
  ): Promise<{ path: string; fullPath: string } | null> {
    const supabase = this.supabaseService.getClient();
    this.logger.log(
      `Attempting to upload file to bucket: ${bucketName}, path: ${filePath}`,
    );

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: this.configService.get<boolean>('SUPABASE_STORAGE_UPSERT', false), // Default to false, can be configured
      });

    if (error) {
      this.logger.error(
        `Error uploading file to Supabase Storage: ${error.message}`,
        error.stack,
      );
      // Consider throwing a more specific error or returning a standardized error response
      throw error; // Or handle error more gracefully
    }

    if (!data || !data.path) {
      this.logger.error(
        'Supabase storage upload did not return a path.',
      );
      return null; // Or throw error
    }
    
    this.logger.log(`File uploaded successfully to path: ${data.path}`);
    
    // The 'path' returned by Supabase is the path within the bucket.
    // 'fullPath' might be needed if it includes the bucket name, but Supabase SDK usually gives bucket-relative path.
    // For signed URLs or public URLs, you'd use other methods.
    return {
      path: data.path,
      fullPath: data.path, // Adjust if Supabase provides a more absolute path or if constructing one.
    };
  }

  async getSignedUrl(bucketName: string, filePath: string, expiresIn: number = 60): Promise<string | null> {
    const supabase = this.supabaseService.getClient();
    this.logger.log(`Generating signed URL for bucket: ${bucketName}, path: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
      return null;
    }
    
    this.logger.log(`Signed URL generated successfully.`);
    return data?.signedUrl || null;
  }

  async downloadFileAsBuffer(bucketName: string, filePath: string): Promise<Buffer> {
    const supabase = this.supabaseService.getClient();
    this.logger.log(`Downloading file from bucket: ${bucketName}, path: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      this.logger.error(`Error downloading file: ${error.message}`, error.stack);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from file download');
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    this.logger.log(`File downloaded successfully, size: ${buffer.length} bytes`);
    return buffer;
  }

  async deleteFile(bucketName: string, filePath: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();
    this.logger.log(`Deleting file from bucket: ${bucketName}, path: ${filePath}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      return false;
    }

    this.logger.log(`File deleted successfully: ${filePath}`);
    return true;
  }

  // Add methods for listFiles, etc. as needed
} 