import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMeta {
  /** 动作标识，如 auth.login / article.publish / oauth.bind */
  action: string;
  /** 资源类型，如 article / comment / sensitive_word / oauth */
  resource?: string;
}

/**
 * 标记一个路由需要写审计日志。配合全局 AuditInterceptor 使用：
 * 成功或失败后都会落库一条审计记录（含操作人、IP、结果）。
 */
export const Audit = (action: string, resource?: string): MethodDecorator =>
  SetMetadata(AUDIT_KEY, { action, resource } satisfies AuditMeta);
