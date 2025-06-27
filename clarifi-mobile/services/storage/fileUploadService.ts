import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../../constants/config'; // Assuming you have this

export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export type OnProgressCallback = (event: ProgressEvent) => void;

/**
 * Represents the data expected from the backend when requesting a pre-signed URL.
 */
export interface PresignedUploadData {
  signedUrl: string; // The pre-signed URL to upload the file to.
  filePath: string; // The path in Supabase storage where the file will be stored.
  bucketName: string;
  requiredContentType: string;
  // method: 'POST' | 'PUT'; // Usually PUT for Supabase signed URLs for upload
  // headers?: { [key: string]: string };
}

/**
 * Represents the result of a file upload attempt.
 */
export interface UploadResult {
  success: boolean;
  error?: string;
  filePath?: string; // The path of the file in Supabase storage, if successful.
}

/**
 * Fetches pre-signed URL data from the backend.
 * @param fileName The name of the file to be uploaded.
 * @param fileType The MIME type of the file.
 * @returns A promise that resolves with the pre-signed URL data from the backend.
 */
const fetchPresignedUrlFromServer = async (
  fileName: string,
  fileType: string
): Promise<{
  success: boolean;
  data?: PresignedUploadData;
  error?: string;
}> => {
  try {
    // TODO: Replace with actual auth token retrieval
    const MOCK_AUTH_TOKEN = 'your-valid-jwt-token';

    const response = await fetch(
      `${API_BASE_URL}/storage/signed-url/statement`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${MOCK_AUTH_TOKEN}`, // Uncomment when auth is ready
        },
        body: JSON.stringify({ fileName, contentType: fileType }),
      }
    );

    const responseBody = await response.json();

    if (!response.ok) {
      console.error('Failed to fetch pre-signed URL:', responseBody);
      return {
        success: false,
        error: responseBody.message || 'Server error fetching signed URL',
      };
    }
    return { success: true, data: responseBody.data as PresignedUploadData };
  } catch (error: any) {
    console.error('Error fetching pre-signed URL:', error);
    return {
      success: false,
      error: error.message || 'Network error fetching signed URL',
    };
  }
};

/**
 * Uploads a file using XMLHttpRequest to a pre-signed URL, enabling progress tracking.
 *
 * @param localFileUri The local URI of the file to upload.
 * @param mimeType The MIME type of the file.
 * @param originalFileName The original name of the file.
 * @param onProgress Optional callback to track upload progress.
 * @param abortSignal Optional AbortSignal to cancel the upload.
 * @returns A promise that resolves with the UploadResult.
 */
export const uploadFile = async (
  localFileUri: string,
  mimeType: string,
  originalFileName: string,
  onProgress?: OnProgressCallback,
  abortSignal?: AbortSignal
): Promise<UploadResult> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(localFileUri);
    if (!fileInfo.exists) {
      return { success: false, error: 'Local file not found.' };
    }

    // Step 1: Get the pre-signed URL from your backend
    const presignedResponse = await fetchPresignedUrlFromServer(
      originalFileName,
      mimeType
    );

    if (!presignedResponse.success || !presignedResponse.data) {
      return {
        success: false,
        error: presignedResponse.error || 'Failed to get pre-signed URL data.',
      };
    }

    const { signedUrl, filePath, requiredContentType } = presignedResponse.data;

    // Ensure the MIME type matches what the signed URL was generated for.
    // This is crucial as the client-provided Content-Type MUST match the one expected by Supabase policy for the signed URL.
    if (mimeType !== requiredContentType) {
      console.warn(
        `MIME type mismatch: local file is ${mimeType}, signed URL expects ${requiredContentType}. Upload might fail or be miscategorized by Supabase.`
      );
      // Potentially return an error or proceed with caution.
      // For now, we proceed, assuming the backend validated correctly based on originalFileName extension.
    }

    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl, true);

      // Set the Content-Type header. Crucial for Supabase signed uploads.
      // The backend's signed URL endpoint should inform the client what this MUST be.
      xhr.setRequestHeader('Content-Type', requiredContentType);
      // xhr.setRequestHeader('x-upsert', 'true'); // If needed, though PUT usually implies upsert for Supabase.

      if (onProgress) {
        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded * 100) / event.total);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage,
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Typically 200 OK for Supabase PUT
          resolve({ success: true, filePath });
        } else {
          console.error('Upload failed (XHR):', xhr.status, xhr.responseText);
          resolve({
            success: false,
            error: `Upload failed: ${xhr.status} - ${xhr.responseText || 'Server error'}`,
          });
        }
      };

      xhr.onerror = () => {
        console.error('Upload error (XHR network):', xhr.responseText);
        resolve({ success: false, error: 'Network error during upload.' });
      };

      xhr.onabort = () => {
        console.log('Upload aborted (XHR).');
        resolve({
          success: false,
          error: 'Upload aborted by user.',
          filePath: undefined,
        }); // Or a specific status
      };

      if (abortSignal) {
        abortSignal.onabort = () => {
          xhr.abort();
        };
      }

      // Read the file as a blob to send with XHR
      FileSystem.readAsStringAsync(localFileUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
        .then(base64 => {
          // Convert base64 to a Blob. First, convert to binary string.
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          xhr.send(blob);
        })
        .catch(err => {
          console.error('Error reading file for XHR upload:', err);
          resolve({ success: false, error: 'Failed to read file for upload.' });
        });
    });
  } catch (error: any) {
    console.error('Error during file upload preparation:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during upload.',
    };
  }
};

export default uploadFile;
