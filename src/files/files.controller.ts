import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from '../auth/authGuard.guard';
import { Response } from 'express';
import * as path from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiOperation({ summary: 'Get user avatar by filename' })
  @ApiParam({ name: 'filename', type: 'string', description: 'Avatar filename' })
  @ApiResponse({ status: 200, description: 'Avatar file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Get('avatars/:filename')
  async serveAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
    return res.sendFile(filePath);
  }
} 