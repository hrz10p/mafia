import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from '../auth/authGuard.guard';
import { Response } from 'express';
import * as path from 'path';

@Controller('files')
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('avatars/:filename')
  async serveAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
    return res.sendFile(filePath);
  }
} 