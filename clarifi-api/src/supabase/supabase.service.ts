import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      this.logger.error('Supabase URL and Anon Key must be provided in .env file');
      throw new Error('Supabase URL and Anon Key must be provided.');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side client should not persist sessions
        detectSessionInUrl: false,
      },
    });
    this.logger.log('Public Supabase client initialized.');

    if (supabaseServiceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false, // Admin client typically doesn't need this
          persistSession: false,
        },
      });
      this.logger.log('Admin Supabase client initialized.');
    } else {
      this.logger.warn('SUPABASE_SERVICE_ROLE_KEY not found. Admin client not initialized.');
    }
  }

  /**
   * Returns the public (anon key) Supabase client.
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Returns the admin (service_role key) Supabase client.
   * Throws an error if the admin client was not initialized (e.g., key missing).
   */
  getAdminClient(): SupabaseClient {
    if (!this.supabaseAdmin) {
      this.logger.error('Supabase admin client is not initialized. Service role key might be missing.');
      throw new Error('Supabase admin client is not available.');
    }
    return this.supabaseAdmin;
  }

  // Helper to get current user from JWT, useful for RLS context in PrismaService or other services.
  // This should ideally be done by the AuthGuard and user attached to request.
  async getUserFromRequest(req: any): Promise<User | null> {
    const authHeader = req.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return null;

    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error) {
      this.logger.warn(`Supabase getUser error from token: ${error.message}`);
      return null;
    }
    return user;
  }

  // You can add specific helper methods for different Supabase features here
  // For example, for auth:
  // get auth() {
  //   return this.supabase.auth;
  // }

  // For storage:
  // get storage() {
  //   return this.supabase.storage;
  // }

  /**
   * Downloads a file from the specified Supabase Storage bucket and returns it as a Buffer.
   * Uses the admin client for potentially privileged access.
   * @param bucketName The name of the bucket.
   * @param filePathInBucket The path to the file within the bucket.
   * @returns A Promise resolving to a Buffer containing the file data.
   * @throws Error if the file download fails or the file is not found.
   */
  async downloadFileAsBuffer(bucketName: string, filePathInBucket: string): Promise<Buffer> {
    this.logger.log(`Attempting to download file: ${filePathInBucket} from bucket: ${bucketName}`);
    const adminClient = this.getAdminClient(); // Ensures admin client is available

    const { data, error } = await adminClient.storage
      .from(bucketName)
      .download(filePathInBucket);

    if (error) {
      this.logger.error(`Failed to download file ${filePathInBucket} from bucket ${bucketName}: ${error.message}`);
      throw new Error(`Supabase storage download error: ${error.message}`);
    }

    if (!data) {
      // This case should ideally be covered by the error above, but as a safeguard
      this.logger.error(`No data returned for file ${filePathInBucket} from bucket ${bucketName}, but no explicit error.`);
      throw new Error(`File not found or empty: ${filePathInBucket}`);
    }

    // Convert Blob to ArrayBuffer, then to Node.js Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}