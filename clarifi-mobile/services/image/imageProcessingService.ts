import * as ImageManipulator from 'expo-image-manipulator';

interface ProcessedImageResult {
  uri: string;
  width: number;
  height: number;
  size?: number; // Size in bytes, if calculable or returned by manipulator
  base64?: string; // Optional, if needed for direct uploads or display
}

const MAX_IMAGE_WIDTH = 1200; // Max width for OCR optimization
const COMPRESSION_QUALITY_JPEG = 0.7; // 0.0 (lowest) to 1.0 (highest)

/**
 * Preprocesses an image by resizing and compressing it.
 * @param originalUri The URI of the original image.
 * @returns A promise that resolves with the processed image details.
 */
export const preprocessImage = async (
  originalUri: string
): Promise<ProcessedImageResult | null> => {
  try {
    // First, get original image dimensions to maintain aspect ratio
    // ImageManipulator.manipulateAsync can get metadata, but it's often simpler to let it handle aspect ratio directly if possible
    // For more complex scenarios, one might use Image.getSize from react-native, but that's async and adds complexity here.

    const actions: ImageManipulator.Action[] = [
      {
        resize: {
          width: MAX_IMAGE_WIDTH, // Resize to max width, height will be adjusted by aspect ratio
        },
      },
    ];

    const saveOptions: ImageManipulator.SaveOptions = {
      compress: COMPRESSION_QUALITY_JPEG,
      format: ImageManipulator.SaveFormat.JPEG, // Standard format, good for photos
      // base64: false, // Set to true if base64 is needed
    };

    const result = await ImageManipulator.manipulateAsync(
      originalUri,
      actions,
      saveOptions
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      // size: result.size, // Property 'size' does not exist on type 'ImageResult'. Removed for now.
      // base64: result.base64, // Uncomment if base64 is enabled in saveOptions
    };
  } catch (error) {
    console.error('Error preprocessing image:', error);
    // Handle specific errors or re-throw if necessary
    // For now, return null to indicate failure, or could return original if processing fails
    return null;
  }
};

// Potential future enhancements:
// - More sophisticated quality assessment (blur, brightness)
// - Allowing dynamic configuration for resize/compression
// - Handling different output formats based on input or needs (e.g., PNG for graphics)
