import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { Express } from 'express';

/** 上传根目录（相对后端进程 cwd，启动于 apps/backend） */
export const UPLOAD_DIR = join(process.cwd(), 'uploads');
/** 静态资源对外访问前缀 */
export const UPLOAD_URL_PREFIX = '/uploads';

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * multer 配置（模块级常量，便于在控制器装饰器中直接引用）。
 * 本地磁盘存储；COS 适配点在 UploadService.save()。
 */
export const UPLOAD_MULTER_OPTIONS = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new BadRequestException('仅支持图片格式（jpg/png/gif/webp/svg）'), false);
    }
    cb(null, true);
  },
};

@Injectable()
export class UploadService {
  /**
   * 持久化文件并返回可访问 URL。
   *
   * 适配层说明：当前为本地磁盘存储。若后续接入腾讯云 COS，
   * 在此读取 process.env.COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION，
   * 调用 cos.putObject 上传并返回
   * https://<bucket>.cos.<region>.myqcloud.com/<key> 即可，
   * 前端与各业务模块无需改动（URL 抽象已统一）。
   */
  async save(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('未接收到文件');
    return `${UPLOAD_URL_PREFIX}/${file.filename}`;
  }
}
