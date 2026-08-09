import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './modules/upload/upload.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局校验管道（Sprint 0 基础）
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS（开发期放开，生产由 Nginx/WAF 控制）
  app.enableCors({ origin: true, credentials: true });

  // 上传静态资源（封面/正文图）可直接访问
  app.use('/uploads', express.static(UPLOAD_DIR));

  // 全局路由前缀
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Blog backend listening on http://localhost:${port}/api/v1`);
}
bootstrap();
