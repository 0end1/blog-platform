import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ArticleEntity } from '../article/article.entity';
import { CategoryEntity } from '../category/category.entity';
import { TagEntity } from '../tag/tag.entity';
import { CommentEntity } from '../comment/comment.entity';
import { ArticleService } from '../article/article.service';
import { CommentStatus } from '../comment/comment.service';
import { CommentService } from '../comment/comment.service';
import { SensitiveWordService } from '../moderation/sensitive-word.service';
import { AuditService } from '../audit/audit.service';
import { ArticleQueryDto } from '../article/dto/article.dto';
import { ArticleUpsertDto } from './dto/article-admin.dto';
import { DateCount, CategoryCount, TopArticle } from '@blog/shared';

/** 将原始日期计数补齐为最近 days 天连续序列（UTC 日期） */
function fillTrend(rows: { date: string; count: string | number }[], days = 14): DateCount[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.date, Number(r.count));
  const out: DateCount[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
    private readonly sensitiveWord: SensitiveWordService,
    private readonly audit: AuditService,
  ) {}

  /** 后台仪表盘统计（Sprint 3 深化：趋势/热门/分类分布） */
  async dashboard() {
    const [
      articleCount,
      publishedArticleCount,
      commentCount,
      pendingCommentCount,
      userCount,
      categoryCount,
      tagCount,
      viewRaw,
      topArticles,
      articleTrendRows,
      commentTrendRows,
      catRows,
    ] = await Promise.all([
      this.articleRepo.count(),
      this.articleRepo.count({ where: { status: 'published' } }),
      this.commentRepo.count(),
      this.commentRepo.count({ where: { status: 'pending' } }),
      this.userRepo.count(),
      this.categoryRepo.count(),
      this.tagRepo.count(),
      this.articleRepo
        .createQueryBuilder('a')
        .select('SUM(a.viewCount)', 'v')
        .getRawOne(),
      this.articleRepo
        .createQueryBuilder('a')
        .select(['a.id', 'a.slug', 'a.title', 'a.viewCount'])
        .orderBy('a.viewCount', 'DESC')
        .take(5)
        .getMany(),
      this.articleRepo
        .createQueryBuilder('a')
        .select("DATE(a.createdAt)", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('a.createdAt >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 13 DAY)')
        .groupBy('DATE(a.createdAt)')
        .getRawMany(),
      this.commentRepo
        .createQueryBuilder('c')
        .select("DATE(c.createdAt)", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('c.createdAt >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 13 DAY)')
        .groupBy('DATE(c.createdAt)')
        .getRawMany(),
      this.articleRepo
        .createQueryBuilder('a')
        .leftJoin('a.category', 'c')
        .select("COALESCE(c.name, '未分类')", 'name')
        .addSelect('COUNT(a.id)', 'count')
        .groupBy('c.id')
        .getRawMany(),
    ]);

    const totalViewCount = Number(viewRaw?.v ?? 0);

    const categoryDistribution: CategoryCount[] = catRows.map(
      (r: { name: Buffer | string; count: string | number }) => ({
        name: String(r.name),
        count: Number(r.count),
      }),
    );

    return {
      articleCount,
      publishedArticleCount,
      commentCount,
      pendingCommentCount,
      userCount,
      categoryCount,
      tagCount,
      totalViewCount,
      topArticles: topArticles as TopArticle[],
      articleTrend: fillTrend(articleTrendRows, 14),
      commentTrend: fillTrend(commentTrendRows, 14),
      categoryDistribution,
    };
  }

  /** 后台文章列表（含草稿） */
  async listArticles(query: ArticleQueryDto) {
    return this.articleService.adminList(query);
  }

  /** 创建文章（authorId 取当前登录管理员） */
  createArticle(dto: ArticleUpsertDto, authorId: string) {
    return this.articleService.adminCreate(dto, authorId);
  }

  /** 更新文章 */
  updateArticle(id: string, dto: ArticleUpsertDto) {
    return this.articleService.adminUpdate(id, dto);
  }

  /** 删除文章 */
  removeArticle(id: string) {
    return this.articleService.adminRemove(id);
  }

  /** 后台评论列表 */
  listComments(status?: CommentStatus) {
    return this.commentService.listAll(status);
  }

  /** 审核评论 */
  moderateComment(id: string, status: CommentStatus) {
    return this.commentService.moderate(id, status);
  }

  /** 批量审核评论（S4-03） */
  async bulkModerateComments(ids: string[], status: CommentStatus) {
    if (!Array.isArray(ids) || ids.length === 0) return { updated: 0 };
    await this.commentRepo
      .createQueryBuilder()
      .update(CommentEntity)
      .set({ status })
      .whereInIds(ids)
      .execute();
    return { updated: ids.length };
  }

  /** 敏感词列表（S4-03） */
  listSensitiveWords() {
    return this.sensitiveWord.list();
  }

  /** 新增敏感词 */
  addSensitiveWord(word: string) {
    return this.sensitiveWord.add(word);
  }

  /** 删除敏感词 */
  removeSensitiveWord(id: string) {
    return this.sensitiveWord.remove(id);
  }

  /** 审计日志查询（S4-04） */
  listAuditLogs(query: {
    limit?: number;
    offset?: number;
    action?: string;
    actorId?: string;
  }) {
    return this.audit.list(query);
  }
}
