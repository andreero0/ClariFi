import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ImageOptimizationOptions {
  targetDpi?: number;
  maxDimension?: number;
  enhanceContrast?: boolean;
  applySharpening?: boolean;
  removeNoise?: boolean;
  correctSkew?: boolean;
  binarize?: boolean;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

export interface ImageMetadata {
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  originalSize: number;
  processedWidth: number;
  processedHeight: number;
  processedSize: number;
  dpi: number;
  aspectRatio: number;
  colorSpace: string;
}

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  // Optimal settings for bank statement OCR
  private readonly BANK_STATEMENT_DEFAULTS: ImageOptimizationOptions = {
    targetDpi: 300,
    maxDimension: 2400,
    enhanceContrast: true,
    applySharpening: true,
    removeNoise: true,
    correctSkew: false, // Disabled by default as it's computationally expensive
    binarize: false,
    format: 'png',
    quality: 100
  };

  /**
   * Optimize image for OCR processing with bank statement specific enhancements
   */
  async optimizeForOcr(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
    try {
      const startTime = Date.now();
      const mergedOptions = { ...this.BANK_STATEMENT_DEFAULTS, ...options };
      
      // Get original image metadata
      const originalMetadata = await sharp(imageBuffer).metadata();
      const originalSize = imageBuffer.length;
      
      this.logger.log(`Starting image optimization: ${originalMetadata.width}x${originalMetadata.height}, ${originalSize} bytes`);

      let processor = sharp(imageBuffer);

      // Step 1: Auto-rotate based on EXIF data
      processor = processor.rotate();

      // Step 2: Handle format conversion and color space
      if (originalMetadata.channels === 4) {
        // Remove alpha channel if present
        processor = processor.removeAlpha();
      }

      // Step 3: Resize image for optimal OCR resolution
      const resizedProcessor = await this.resizeForOcr(processor, originalMetadata, mergedOptions);
      processor = resizedProcessor;

      // Step 4: Convert to grayscale for better text recognition
      processor = processor.greyscale();

      // Step 5: Apply noise reduction if enabled
      if (mergedOptions.removeNoise) {
        processor = this.applyNoiseReduction(processor);
      }

      // Step 6: Enhance contrast if enabled
      if (mergedOptions.enhanceContrast) {
        processor = this.enhanceContrast(processor);
      }

      // Step 7: Apply binarization if enabled (good for clean documents)
      if (mergedOptions.binarize) {
        processor = this.applyBinarization(processor);
      }

      // Step 8: Apply sharpening if enabled
      if (mergedOptions.applySharpening) {
        processor = this.applySharpeningFilter(processor);
      }

      // Step 9: Skew correction (optional, expensive operation)
      if (mergedOptions.correctSkew) {
        // Note: Basic skew correction - for advanced skew correction,
        // consider using external libraries like OpenCV
        processor = this.correctBasicSkew(processor);
      }

      // Step 10: Final format conversion
      const finalProcessor = this.applyFinalFormat(processor, mergedOptions);
      const optimizedBuffer = await finalProcessor.toBuffer();

      // Get final metadata
      const finalMetadata = await sharp(optimizedBuffer).metadata();
      
      const processingTime = Date.now() - startTime;
      this.logger.log(`Image optimization completed in ${processingTime}ms: ${finalMetadata.width}x${finalMetadata.height}, ${optimizedBuffer.length} bytes`);

      const metadata: ImageMetadata = {
        originalWidth: originalMetadata.width || 0,
        originalHeight: originalMetadata.height || 0,
        originalFormat: originalMetadata.format || 'unknown',
        originalSize,
        processedWidth: finalMetadata.width || 0,
        processedHeight: finalMetadata.height || 0,
        processedSize: optimizedBuffer.length,
        dpi: this.calculateDpi(finalMetadata.width || 0, mergedOptions.targetDpi || 300),
        aspectRatio: (finalMetadata.width || 1) / (finalMetadata.height || 1),
        colorSpace: finalMetadata.space || 'unknown'
      };

      return { buffer: optimizedBuffer, metadata };

    } catch (error) {
      this.logger.error('Image optimization failed', error);
      throw new BadRequestException(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Resize image to optimal dimensions for OCR
   */
  private async resizeForOcr(
    processor: sharp.Sharp,
    originalMetadata: sharp.Metadata,
    options: ImageOptimizationOptions
  ): Promise<sharp.Sharp> {
    const { targetDpi = 300, maxDimension = 2400 } = options;
    const originalWidth = originalMetadata.width || 0;
    const originalHeight = originalMetadata.height || 0;

    // Calculate target dimensions based on DPI requirements
    // For bank statements, 300 DPI is optimal (trade-off between quality and processing time)
    const minWidthForDpi = Math.max(1200, targetDpi * 4); // Assume 4-inch minimum width
    
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    // Scale up if image is too small
    if (originalWidth < minWidthForDpi) {
      const scaleFactor = minWidthForDpi / originalWidth;
      targetWidth = Math.round(originalWidth * scaleFactor);
      targetHeight = Math.round(originalHeight * scaleFactor);
    }

    // Scale down if image is too large
    const maxDim = Math.max(targetWidth, targetHeight);
    if (maxDim > maxDimension) {
      const scaleFactor = maxDimension / maxDim;
      targetWidth = Math.round(targetWidth * scaleFactor);
      targetHeight = Math.round(targetHeight * scaleFactor);
    }

    // Only resize if dimensions changed significantly (>5% difference)
    const widthDiff = Math.abs(targetWidth - originalWidth) / originalWidth;
    const heightDiff = Math.abs(targetHeight - originalHeight) / originalHeight;

    if (widthDiff > 0.05 || heightDiff > 0.05) {
      this.logger.log(`Resizing image from ${originalWidth}x${originalHeight} to ${targetWidth}x${targetHeight}`);
      
      return processor.resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.lanczos3, // High-quality resampling
        withoutEnlargement: false,
        fastShrinkOnLoad: true
      });
    }

    return processor;
  }

  /**
   * Apply noise reduction for cleaner OCR results
   */
  private applyNoiseReduction(processor: sharp.Sharp): sharp.Sharp {
    // Apply a slight blur to reduce noise, followed by sharpening
    return processor
      .blur(0.3) // Very slight blur to reduce noise
      .median(1); // Median filter to remove salt-and-pepper noise
  }

  /**
   * Enhance contrast for better text recognition
   */
  private enhanceContrast(processor: sharp.Sharp): sharp.Sharp {
    return processor
      .normalize() // Stretch contrast to use full dynamic range
      .gamma(1.2) // Slight gamma correction to enhance mid-tones
      .linear(1.2, -(256 * 0.2 * 0.1)); // Linear adjustment: multiply by 1.2, subtract offset
  }

  /**
   * Apply binarization (black and white) for very clean documents
   */
  private applyBinarization(processor: sharp.Sharp): sharp.Sharp {
    // Apply threshold to create binary image
    return processor.threshold(128, {
      greyscale: false,
      grayscale: false
    });
  }

  /**
   * Apply optimal sharpening for text recognition
   */
  private applySharpeningFilter(processor: sharp.Sharp): sharp.Sharp {
    return processor.sharpen({
      sigma: 1.5,      // Standard deviation of Gaussian mask
      m1: 0.8,         // Threshold for edge detection
      m2: 3.0,         // Threshold for edge enhancement
      x1: 3,           // Flat area threshold
      y2: 12,          // Maximum enhancement for edges
      y3: 20           // Maximum enhancement for corners
    });
  }

  /**
   * Basic skew correction (for more advanced correction, use OpenCV)
   */
  private correctBasicSkew(processor: sharp.Sharp): sharp.Sharp {
    // This is a placeholder for basic skew correction
    // For production use, consider integrating with OpenCV or similar library
    // that can detect and correct document skew automatically
    
    // For now, just ensure the image is properly oriented
    return processor.rotate(0); // No rotation, just normalizes orientation
  }

  /**
   * Apply final format optimization
   */
  private applyFinalFormat(
    processor: sharp.Sharp,
    options: ImageOptimizationOptions
  ): sharp.Sharp {
    const { format = 'png', quality = 100 } = options;

    switch (format) {
      case 'jpeg':
        return processor.jpeg({
          quality,
          progressive: false,
          mozjpeg: true // Better compression
        });
      
      case 'webp':
        return processor.webp({
          quality,
          lossless: quality === 100,
          nearLossless: quality > 90
        });
      
      case 'png':
      default:
        return processor.png({
          quality,
          compressionLevel: 6,
          adaptiveFiltering: true
        });
    }
  }

  /**
   * Calculate effective DPI based on image dimensions
   */
  private calculateDpi(width: number, targetDpi: number): number {
    // Assume standard 8.5" width for bank statements
    const assumedWidthInches = 8.5;
    return Math.round(width / assumedWidthInches);
  }

  /**
   * Optimize specifically for bank statement documents
   */
  async optimizeForBankStatement(imageBuffer: Buffer): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
    const bankStatementOptions: ImageOptimizationOptions = {
      ...this.BANK_STATEMENT_DEFAULTS,
      enhanceContrast: true,
      removeNoise: true,
      applySharpening: true,
      targetDpi: 300, // Optimal for bank statement text
      maxDimension: 2400 // Good balance between quality and performance
    };

    return this.optimizeForOcr(imageBuffer, bankStatementOptions);
  }

  /**
   * Optimize for different document types
   */
  async optimizeForDocumentType(
    imageBuffer: Buffer,
    documentType: 'bank_statement' | 'receipt' | 'invoice' | 'general'
  ): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
    let options: ImageOptimizationOptions;

    switch (documentType) {
      case 'bank_statement':
        options = this.BANK_STATEMENT_DEFAULTS;
        break;
      
      case 'receipt':
        options = {
          ...this.BANK_STATEMENT_DEFAULTS,
          targetDpi: 400, // Higher DPI for small receipt text
          enhanceContrast: true,
          binarize: false // Receipts often have background patterns
        };
        break;
      
      case 'invoice':
        options = {
          ...this.BANK_STATEMENT_DEFAULTS,
          targetDpi: 300,
          enhanceContrast: true,
          removeNoise: true
        };
        break;
      
      case 'general':
      default:
        options = {
          targetDpi: 300,
          enhanceContrast: true,
          applySharpening: true,
          removeNoise: false,
          format: 'png'
        };
        break;
    }

    return this.optimizeForOcr(imageBuffer, options);
  }

  /**
   * Analyze image quality and suggest optimizations
   */
  async analyzeImageQuality(imageBuffer: Buffer): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
    metadata: Partial<ImageMetadata>;
  }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();
      
      const recommendations: string[] = [];
      let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

      // Check resolution
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const estimatedDpi = this.calculateDpi(width, 300);

      if (estimatedDpi < 200) {
        quality = 'poor';
        recommendations.push('Image resolution is too low for optimal OCR. Consider using a higher resolution scan.');
      } else if (estimatedDpi < 250) {
        quality = 'fair';
        recommendations.push('Image resolution could be improved for better OCR accuracy.');
      } else if (estimatedDpi < 300) {
        quality = 'good';
        recommendations.push('Image resolution is acceptable but could be slightly improved.');
      }

      // Check if image is too large (can slow processing)
      if (width > 3000 || height > 3000) {
        recommendations.push('Image is very large and may slow processing. Consider resizing for better performance.');
      }

      // Check color depth
      if (metadata.channels && metadata.channels > 1) {
        recommendations.push('Converting to grayscale may improve OCR accuracy and reduce processing time.');
      }

      // Analyze contrast using standard deviation
      const channelStats = stats.channels || [];
      if (channelStats.length > 0) {
        const avgStdDev = channelStats.reduce((sum, channel) => sum + (channel.stdev || 0), 0) / channelStats.length;
        
        if (avgStdDev < 30) {
          if (quality === 'excellent') quality = 'good';
          if (quality === 'good') quality = 'fair';
          recommendations.push('Image has low contrast. Consider applying contrast enhancement.');
        }
      }

      return {
        quality,
        recommendations,
        metadata: {
          originalWidth: width,
          originalHeight: height,
          originalFormat: metadata.format,
          originalSize: imageBuffer.length,
          dpi: estimatedDpi,
          aspectRatio: width / height,
          colorSpace: metadata.space
        }
      };

    } catch (error) {
      this.logger.error('Image quality analysis failed', error);
      throw new BadRequestException(`Image quality analysis failed: ${error.message}`);
    }
  }
} 