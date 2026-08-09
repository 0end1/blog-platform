import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';

export interface AuditEntryInput {
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  success?: boolean;
  detail?: string | null;
}

export interface AuditListQuery {
  limit?: number;
  offset?: number;
  action?: string;
  actorId?: string;
}

/** 审计日志读写服务（S4-04） */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /** 落库一条审计记录；写入失败仅记录错误，不阻断业务 */
  async log(entry: AuditEntryInput): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          action: entry.action,
          resource: entry.resource ?? null,
          resourceId: entry.resourceId ?? null,
          actorId: entry.actorId ?? null,
          actorEmail: entry.actorEmail ?? null,
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
          success: entry.success ?? true,
          detail: entry.detail ?? null,
        }),
      );
    } catch (err) {
      // 审计失败不应影响主流程（如登录），仅打印以便排查 DB 可用性
      this.logger.error('写入审计日志失败', err as Error);
    }
  }

  /** 后台分页查询审计日志（按时间倒序） */
  async list(query: AuditListQuery) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC');
    if (query.action) {
      qb.andWhere('a.action = :action', { action: query.action });
    }
    if (query.actorId) {
      qb.andWhere('a.actorId = :actorId', { actorId: query.actorId });
    }
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    const offset = Math.max(Number(query.offset ?? 0), 0);
    const [items, total] = await qb.take(limit).skip(offset).getManyAndCount();
    return { items, total, limit, offset };
  }
}
