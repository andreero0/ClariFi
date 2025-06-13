import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StatementProcessingService, ProcessStatementDto } from './statement-processing.service';
import { StorageService } from '../storage/storage.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Statement Processing')
@ApiBearerAuth()
@Controller('statements')
@UseGuards(AuthGuard)
export class StatementProcessingController {
  constructor(
    private readonly statementProcessingService: StatementProcessingService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and process bank statement' })
  @ApiResponse({ status: 200, description: 'Statement uploaded and queued for processing' })
  @ApiResponse({ status: 400, description: 'Invalid file or validation failed' })
  async uploadStatement(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Upload file to storage
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      `statements/${req.user.sub}/${Date.now()}_${file.originalname}`,
      'statements', // bucket name
      file.mimetype,
    );

    if (!uploadResult) {
      throw new BadRequestException('File upload failed');
    }

    // Process statement
    const processData: ProcessStatementDto = {
      fileName: uploadResult.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      userId: req.user.sub,
    };

    return this.statementProcessingService.processStatement(processData);
  }

  @Post('process')
  @ApiOperation({ summary: 'Process previously uploaded statement' })
  @ApiResponse({ status: 200, description: 'Statement queued for processing' })
  async processStatement(
    @Body() data: ProcessStatementDto,
    @Request() req: any,
  ) {
    data.userId = req.user.sub;
    return this.statementProcessingService.processStatement(data);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get statement processing status' })
  @ApiResponse({ status: 200, description: 'Statement processing status retrieved' })
  @ApiResponse({ status: 404, description: 'Statement not found' })
  async getProcessingStatus(
    @Param('id') statementId: string,
    @Request() req: any,
  ) {
    return this.statementProcessingService.getProcessingStatus(statementId, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get user statement history' })
  @ApiResponse({ status: 200, description: 'Statement history retrieved' })
  async getUserStatements(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.statementProcessingService.getUserStatements(
      req.user.sub,
      limitNum,
      offsetNum,
    );
  }

  @Get('upload-url')
  @ApiOperation({ summary: 'Get pre-signed URL for direct file upload' })
  @ApiResponse({ status: 200, description: 'Pre-signed URL generated' })
  async getUploadUrl(@Request() req: any) {
    // For now, return a simple response indicating direct upload
    return {
      message: 'Use the /statements/upload endpoint for file upload',
      endpoint: '/statements/upload',
    };
  }
}