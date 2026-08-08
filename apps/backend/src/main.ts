import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局校验管道（Sprint 0 基础）
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS（开发期放开，生产由 Nginx/WAF 控制）
  app.enableCors({ origin: true, credentials: true });

  // 全局路由前缀
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Blog backend listening on http://localhost:${port}/api/v1`);
}
bootstrap();
