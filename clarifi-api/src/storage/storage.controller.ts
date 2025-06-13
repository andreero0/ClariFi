import { Injectable, Logger } from '@nestjs/common'; // Placeholder, actual controller imports are more extensive
import 'multer'; // ADDED TO HELP WITH Express.Multer.File TYPE RESOLUTION
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Inject,
  Body,
  HttpCode,
  HttpStatus,
  Logger as NestLogger, // Renamed to avoid conflict if Logger was already imported
  UseGuards, // Assuming you'll add an AuthGuard later
  Req, // To potentially get user from request
  Get, // For GET endpoints
  Delete, // For DELETE endpoints
  Param, // For route parameters
  NotFoundException, // For 404 errors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { UploadValidationService } from '../upload-validation/upload-validation.service';
import { PdfProcessorService } from '../upload-validation/pdf-processor.service';
import { TemporaryFileManagerService } from './temporary-file-manager.service';
import { ValidateUploadRequestDto } from '../upload-validation/dto/validation.dto';
import {
  PageReorderRequestDto,
  PageOperationRequestDto,
  SplitDocumentRequestDto,
  MergeDocumentsRequestDto,
} from '../upload-validation/dto/document-page.dto';
import {
  CreateTemporaryFileRequestDto,
  UpdateTemporaryFileRequestDto,
  BulkCleanupRequestDto,
} from './dto/temporary-file.dto';
// import { AuthGuard } from '../auth/guards/auth.guard'; // Example: if you have an AuthGuard

// Simple DTO for signed URL request
class SignedUrlRequestDto {
  fileName: string;
  contentType: string;
  // userId: string; // Could be added or taken from JWT
}

@Controller('storage')
export class StorageController {
  private readonly logger = new NestLogger(StorageController.name); // Use aliased Logger

  constructor(
    private readonly storageService: StorageService,
    private readonly uploadValidationService: UploadValidationService,
    private readonly pdfProcessorService: PdfProcessorService,
    private readonly temporaryFileManager: TemporaryFileManagerService,
  ) {}

  // Endpoint for backend-mediated uploads
  @Post('upload/statement')
  // @UseGuards(AuthGuard) // Protect this route later
  @UseInterceptors(FileInterceptor('file')) // 'file' is the field name in multipart/form-data
  async uploadStatementFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // new FileTypeValidator({ fileType: 'image/jpeg|image/png|application/pdf' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Req() req: any, // Used to get user if AuthGuard is active: req.user
  ) {
    this.logger.log(
      `Received file upload request: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`,
    );
    const userId = req.user?.id || 'anonymous'; // Replace with actual user ID from auth
    const bucketName = 'statements'; // Or get from config
    const filePath = `${userId}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    try {
      const result = await this.storageService.uploadFile(
        file.buffer,
        filePath,
        bucketName,
        file.mimetype,
      );
      this.logger.log(`File uploaded via backend: ${JSON.stringify(result)}`);
      return {
        message: 'File uploaded successfully via backend',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Backend upload failed for ${file.originalname}: ${error.message}`,
        error.stack,
      );
      // Consider returning a more specific HTTP error status based on the error type
      throw error; // NestJS will handle this as a 500 by default or specific if HttpExceptions are thrown
    }
  }

  // Endpoint to generate a pre-signed URL for client-side uploads
  @Post('signed-url/statement')
  // @UseGuards(AuthGuard) // Protect this route later
  @HttpCode(HttpStatus.OK)
  async getSignedUrlForStatement(
    @Body() body: SignedUrlRequestDto,
    @Req() req: any, // To get user: req.user
  ) {
    const userId = req.user?.id || 'anonymous'; // Replace with actual user ID from auth
    const bucketName = 'statements';
    // Sanitize filename further if needed
    const filePath = `${userId}/${Date.now()}-${body.fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const expiresIn = 300; // URL valid for 5 minutes

    this.logger.log(
      `Requesting signed URL for path: ${filePath} in bucket ${bucketName}`,
    );

    try {
      // Note: For Supabase, the client needs to set the Content-Type header when using the signed URL.
      // The createSignedUrl method in Supabase JS v2 doesn't directly take contentType for the PUT request.
      // The client must send the exact contentType that was intended.
      const signedUrl = await this.storageService.getSignedUrl(
        bucketName,
        filePath,
        expiresIn,
      );

      if (!signedUrl) {
        this.logger.error('Failed to generate signed URL.');
        // Consider throwing a NotFoundException or InternalServerErrorException
        return { message: 'Failed to generate signed URL' }; // Or throw appropriate HttpException
      }

      this.logger.log(`Signed URL generated: ${signedUrl}`);
      return {
        message: 'Signed URL generated successfully',
        data: {
          signedUrl,
          filePath, // The path client should use or confirm after upload
          bucketName,
          // Include the actual content type the client MUST use
          // This is crucial because Supabase signed URLs for upload don't pre-set the content type.
          // The client must set it correctly when making the PUT request.
          requiredContentType: body.contentType 
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${body.fileName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Endpoint to validate uploaded files
  @Post('validate-upload')
  // @UseGuards(AuthGuard) // Protect this route later
  @HttpCode(HttpStatus.OK)
  async validateUpload(
    @Body() body: ValidateUploadRequestDto,
    @Req() req: any, // To get user: req.user
  ) {
    this.logger.log(
      `Received validation request for file: ${body.filePathInBucket}, original: ${body.originalFileName}`,
    );

    try {
      const validationResult = await this.uploadValidationService.validateFile(
        body.filePathInBucket,
        body.originalMimeType,
        body.originalFileName,
      );

      this.logger.log(`Validation completed for ${body.originalFileName}: ${validationResult.isValid ? 'VALID' : 'INVALID'}`);
      
      return {
        message: 'File validation completed',
        data: validationResult,
      };
    } catch (error) {
      this.logger.error(
        `Validation failed for ${body.originalFileName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Multi-page document processing endpoints

  @Post('process-document')
  @HttpCode(HttpStatus.OK)
  async processDocument(
    @Body() body: { filePathInBucket: string; originalFileName: string },
    @Req() req: any,
  ) {
    this.logger.log(
      `Processing document: ${body.originalFileName} at ${body.filePathInBucket}`,
    );

    try {
      // Download file from storage
      const fileBuffer = await this.storageService.downloadFileAsBuffer(
        'statements',
        body.filePathInBucket,
      );

      // Process the document to extract pages
      const result = await this.pdfProcessorService.processDocument(
        fileBuffer,
        body.originalFileName,
      );

      this.logger.log(
        `Document processed successfully: ${result.structure.totalPages} pages found`,
      );

      return {
        message: 'Document processed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Document processing failed for ${body.originalFileName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('reorder-pages')
  @HttpCode(HttpStatus.OK)
  async reorderPages(
    @Body() body: PageReorderRequestDto,
    @Req() req: any,
  ) {
    this.logger.log(
      `Reordering pages for document: ${body.documentId}`,
    );

    try {
      const result = await this.pdfProcessorService.reorderPages(body);

      return {
        message: 'Pages reordered successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Page reordering failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('page-operation')
  @HttpCode(HttpStatus.OK)
  async performPageOperation(
    @Body() body: PageOperationRequestDto,
    @Req() req: any,
  ) {
    this.logger.log(
      `Performing ${body.operation} on page ${body.pageId} of document ${body.documentId}`,
    );

    try {
      const result = await this.pdfProcessorService.performPageOperation(body);

      return {
        message: `Page ${body.operation} completed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Page operation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('split-document')
  @HttpCode(HttpStatus.OK)
  async splitDocument(
    @Body() body: SplitDocumentRequestDto,
    @Req() req: any,
  ) {
    this.logger.log(
      `Splitting document ${body.documentId} at pages: ${body.splitPoints.join(', ')}`,
    );

    try {
      const result = await this.pdfProcessorService.splitDocument(body);

      return {
        message: 'Document split successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Document splitting failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('merge-documents')
  @HttpCode(HttpStatus.OK)
  async mergeDocuments(
    @Body() body: MergeDocumentsRequestDto,
    @Req() req: any,
  ) {
    this.logger.log(
      `Merging documents: ${body.documentIds.join(', ')}`,
    );

    try {
      const result = await this.pdfProcessorService.mergeDocuments(body);

      return {
        message: 'Documents merged successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Document merging failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('generate-thumbnail')
  @HttpCode(HttpStatus.OK)
  async generateThumbnail(
    @Body() body: { documentId: string; pageNumber: number; width?: number; height?: number },
    @Req() req: any,
  ) {
    this.logger.log(
      `Generating thumbnail for document ${body.documentId}, page ${body.pageNumber}`,
    );

    try {
      const size = {
        width: body.width || 200,
        height: body.height || 300,
      };

      const thumbnailBuffer = await this.pdfProcessorService.generatePageThumbnail(
        body.documentId,
        body.pageNumber,
        size,
      );

      // Convert buffer to base64 for easy frontend consumption
      const base64Thumbnail = thumbnailBuffer.toString('base64');

      return {
        message: 'Thumbnail generated successfully',
        data: {
          thumbnail: `data:image/png;base64,${base64Thumbnail}`,
          size,
        },
      };
    } catch (error) {
      this.logger.error(
        `Thumbnail generation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Temporary File Management endpoints

  @Post('temp/create')
  @HttpCode(HttpStatus.OK)
  async createTemporaryFile(
    @Body() body: CreateTemporaryFileRequestDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'anonymous';
    this.logger.log(
      `Creating temporary file: ${body.originalFileName} for user: ${userId}`,
    );

    try {
      const tempFile = await this.temporaryFileManager.createTemporaryFile(
        userId,
        body,
      );

      this.logger.log(`Temporary file created: ${tempFile.id}`);
      return {
        message: 'Temporary file created successfully',
        data: tempFile,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create temporary file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('temp/:fileId/update')
  @HttpCode(HttpStatus.OK)
  async updateTemporaryFile(
    @Param('fileId') fileId: string,
    @Body() body: UpdateTemporaryFileRequestDto,
    @Req() req: any,
  ) {
    this.logger.log(`Updating temporary file: ${fileId}`);

    try {
      const tempFile = await this.temporaryFileManager.updateTemporaryFile(
        fileId,
        body,
      );

      this.logger.log(`Temporary file updated: ${fileId}`);
      return {
        message: 'Temporary file updated successfully',
        data: tempFile,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update temporary file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('temp/:fileId')
  @HttpCode(HttpStatus.OK)
  async getTemporaryFile(
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    try {
      const tempFile = this.temporaryFileManager.getTemporaryFile(fileId);

      if (!tempFile) {
        throw new NotFoundException(`Temporary file not found: ${fileId}`);
      }

      return {
        message: 'Temporary file retrieved successfully',
        data: tempFile,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get temporary file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('temp/session/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getUploadSession(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    try {
      const session = this.temporaryFileManager.getUploadSession(sessionId);

      if (!session) {
        throw new NotFoundException(`Upload session not found: ${sessionId}`);
      }

      return {
        message: 'Upload session retrieved successfully',
        data: session,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get upload session: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('temp/user/files')
  @HttpCode(HttpStatus.OK)
  async getUserTemporaryFiles(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    
    try {
      const files = this.temporaryFileManager.getUserTemporaryFiles(userId);

      return {
        message: 'User temporary files retrieved successfully',
        data: files,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user temporary files: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete('temp/:fileId')
  @HttpCode(HttpStatus.OK)
  async deleteTemporaryFile(
    @Param('fileId') fileId: string,
    @Req() req: any,
  ) {
    this.logger.log(`Deleting temporary file: ${fileId}`);

    try {
      await this.temporaryFileManager.deleteTemporaryFile(fileId);

      this.logger.log(`Temporary file deleted: ${fileId}`);
      return {
        message: 'Temporary file deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete temporary file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post('temp/cleanup')
  @HttpCode(HttpStatus.OK)
  async performCleanup(
    @Body() body: BulkCleanupRequestDto,
    @Req() req: any,
  ) {
    this.logger.log('Performing manual temporary file cleanup');

    try {
      const result = await this.temporaryFileManager.performCleanup(body);

      this.logger.log(
        `Cleanup completed: ${result.filesDeleted} files deleted, ${result.bytesReclaimed} bytes reclaimed`,
      );
      return {
        message: 'Cleanup completed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Cleanup failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('temp/stats')
  @HttpCode(HttpStatus.OK)
  async getStorageStats(@Req() req: any) {
    try {
      const stats = this.temporaryFileManager.getStorageStats();

      return {
        message: 'Storage statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get storage stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('temp/user/quota')
  @HttpCode(HttpStatus.OK)
  async getUserQuota(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    
    try {
      const quota = this.temporaryFileManager.getUserQuota(userId);

      return {
        message: 'User quota retrieved successfully',
        data: quota,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user quota: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
} 