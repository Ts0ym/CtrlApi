import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

const PROJECT_PREVIEWS_DIR = join(process.cwd(), 'uploads', 'project-previews');
const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const ALLOWED_FALLBACK_EXTENSIONS = new Set(['.avif', '.jpg', '.jpeg', '.png', '.webp']);

@Controller('uploads')
@UseGuards(AdminAuthGuard)
export class UploadsController {
  @Post('project-preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadProjectPreview(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Preview file is required');
    }

    const fallbackExtension = extname(file.originalname || '').toLowerCase();
    const normalizedExtension = ALLOWED_MIME_EXTENSIONS[file.mimetype]
      || (ALLOWED_FALLBACK_EXTENSIONS.has(fallbackExtension) ? fallbackExtension : '');

    if (!normalizedExtension) {
      throw new BadRequestException('Unsupported preview image type');
    }

    mkdirSync(PROJECT_PREVIEWS_DIR, { recursive: true });

    const filename = `${Date.now()}-${randomUUID()}${normalizedExtension}`;
    const absolutePath = join(PROJECT_PREVIEWS_DIR, filename);
    const publicPath = `/uploads/project-previews/${filename}`;

    writeFileSync(absolutePath, file.buffer);

    return {
      path: publicPath,
      filename,
    };
  }
}
