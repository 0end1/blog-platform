import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 审计日志（S4-04 安全加固）：
 * 记录登录、发布、评论审核、敏感词维护、OAuth 绑定/解绑等敏感操作，
 * 用于安全复盘、越权排查与合规留痕。审计写入失败不影响主流程。
 */
@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 操作人（匿名操作如登录尝试为 null） */
  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  actorId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorEmail?: string | null;

  /** 动作标识，如 auth.login / article.publish / oauth.bind */
  @Index()
  @Column({ type: 'varchar', length: 128 })
  action: string;

  /** 资源类型，如 article / comment / sensitive_word / oauth */
  @Column({ type: 'varchar', length: 64, nullable: true })
  resource?: string | null;

  /** 资源主键，从路由参数 :id 提取 */
  @Column({ type: 'varchar', length: 128, nullable: true })
  resourceId?: string | null;

  @Index()
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent?: string | null;

  /** 操作结果：成功 true / 失败 false（如登录失败） */
  @Column({ type: 'boolean', default: true })
  success: boolean;

  /** 失败原因或附加说明 */
  @Column({ type: 'text', nullable: true })
  detail?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
