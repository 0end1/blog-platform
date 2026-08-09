import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_KEY, AuditMeta } from '../decorators/audit.decorator';
import { JwtPayload } from '../../modules/auth/strategies/access-jwt.strategy';

/**
 * 全局审计拦截器（S4-04）：
 * 仅对标注 @Audit() 的路由生效，在请求成功或失败后异步落库审计记录。
 * 不读取响应体，仅记录动作/资源/操作人/IP/结果，零侵入业务。
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, context.getHandler());
    if (!meta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    // 未认证请求（如登录/注册）无法从 JWT 取身份，尝试从请求体读取 email 以便安全留痕
    const bodyEmail = (request.body?.email as string | undefined) ?? undefined;
    const ip =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown';
    const userAgent = (request.headers['user-agent'] as string) ?? null;
    const resourceId = (request.params?.id as string) ?? null;

    const baseEntry = {
      action: meta.action,
      resource: meta.resource ?? null,
      resourceId,
      actorId: user?.sub ?? null,
      actorEmail: user?.email ?? bodyEmail ?? null,
      ip,
      userAgent,
    };

    return next.handle().pipe(
      tap({
        next: () => {
          void this.audit.log({ ...baseEntry, success: true });
        },
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          void this.audit.log({ ...baseEntry, success: false, detail: message });
        },
      }),
    );
  }
}
