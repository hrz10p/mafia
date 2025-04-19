import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class FilesService {
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads', 'avatars');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async saveAvatar(userId: number, file: Express.Multer.File): Promise<string> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `avatar_${userId}${fileExtension}`;
    const filePath = path.join(this.uploadPath, fileName);

    // Delete old avatar if exists
    await this.deleteOldAvatar(userId);

    await writeFile(filePath, file.buffer);
    return fileName;
  }

  private async deleteOldAvatar(userId: number) {
    try {
      const files = await fs.promises.readdir(this.uploadPath);
      const oldAvatar = files.find(file => file.startsWith(`avatar_${userId}`));
      
      if (oldAvatar) {
        await unlink(path.join(this.uploadPath, oldAvatar));
      }
    } catch (error) {
      // Ignore errors if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getDefaultAvatarPath(): string {
    return '/uploads/avatars/default-avatar.png';
  }
} 