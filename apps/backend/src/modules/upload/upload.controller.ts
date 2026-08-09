import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { AccessJwtAuthGuard } from '../auth/guards/access-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@blog/shared';
import { UploadService, UPLOAD_MULTER_OPTIONS } from './upload.service';

@Controller('upload')
@UseGuards(AccessJwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /** 上传图片（封面/正文图），返回可访问 URL */
  @Post('image')
  @UseInterceptors(FileInterceptor('file', UPLOAD_MULTER_OPTIONS))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.save(file);
    return { url };
  }
}
