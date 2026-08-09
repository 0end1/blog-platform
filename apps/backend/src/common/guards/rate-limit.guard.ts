import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * 轻量进程内限流守卫（S4-04 安全加固）：
 * 按客户端 IP 做固定窗口计数，默认 1 分钟 200 次。
 * 单机后台场景足够，生产环境可替换为 Redis 分布式限流或网关层限流。
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 200;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    const entry = this.hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    entry.count += 1;
    if (entry.count > MAX_REQUESTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        `请求过于频繁，请在 ${retryAfter}s 后重试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
