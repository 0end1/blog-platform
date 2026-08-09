import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from '../article/article.entity';
import { SearchQueryDto } from './search.dto';

export interface SearchHit extends ArticleEntity {
  /** 高亮后的标题（含 <mark> 标签，已转义） */
  highlightedTitle: string;
  /** 高亮后的内容摘要片段 */
  snippet: string;
}

/**
 * 搜索服务。
 *
 * 当前实现基于 MySQL InnoDB 全文索引（ngram 解析器，正确支持中文分词），
 * 覆盖 Sprint 3「全文检索 + 高亮 + 搜索建议」。
 * 当 FULLTEXT 不可用或返回为空时自动回退到 LIKE 检索，保证可用性。
 *
 * 后续若引入 Elasticsearch，只需在此处替换底层检索实现（保持接口不变），
 * 即可无缝切换（见 Sprint 3 S3-01 预留的 ES 适配点）。
 */
@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(ArticleEntity)
    private readonly repo: Repository<ArticleEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureFulltextIndex();
  }

  /** 幂等创建文章全文索引（ngram 解析器支持中文） */
  private async ensureFulltextIndex() {
    try {
      const rows = await this.repo.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'articles' AND INDEX_TYPE = 'FULLTEXT' LIMIT 1`,
      );
      if (!rows.length) {
        await this.repo.query(
          `ALTER TABLE articles ADD FULLTEXT INDEX ft_article_search (title, summary, content) WITH PARSER ngram`,
        );
        this.logger.log('已创建文章全文索引 ft_article_search (ngram)');
      }
    } catch (err) {
      this.logger.warn(`全文索引初始化失败，将回退到 LIKE 搜索：${err.message}`);
    }
  }

  /** 基础查询构造：match=true 使用 FULLTEXT，否则 LIKE 兜底 */
  private baseQb(match: boolean, q: string) {
    const qb = this.repo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.status = :status', { status: 'published' });
    if (match) {
      const m =
        'MATCH(article.title, article.summary, article.content) AGAINST (:q IN NATURAL LANGUAGE MODE)';
      qb.andWhere(`${m} > 0`).setParameter('q', q);
    } else {
      qb.andWhere(
        '(article.title LIKE :kw OR article.summary LIKE :kw OR article.content LIKE :kw)',
        { kw: `%${q}%` },
      );
    }
    return qb;
  }

  async search(dto: SearchQueryDto) {
    const q = dto.q.trim();
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 10;

    // 先探测 FULLTEXT 是否能命中，不能则回退 LIKE
    const probe = this.baseQb(true, q);
    const matchTotal = await probe.getCount();
    const useMatch = matchTotal > 0;

    const fetchQb = this.baseQb(useMatch, q);
    if (useMatch) {
      const m =
        'MATCH(article.title, article.summary, article.content) AGAINST (:q IN NATURAL LANGUAGE MODE)';
      // 用 addSelect 计算相关度并以其别名排序，避免 TypeORM 将原始 MATCH 表达式误判为列别名
      fetchQb.addSelect(m, 'score').orderBy('score', 'DESC').setParameter('q', q);
    } else {
      fetchQb.orderBy('article.createdAt', 'DESC');
    }

    const [items, total] = await fetchQb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const hits: SearchHit[] = items.map((a) => ({
      ...a,
      highlightedTitle: this.highlight(a.title, q),
      snippet: this.makeSnippet(a.content ?? a.summary ?? '', q),
    }));

    return { items: hits, total, page, pageSize };
  }

  /** 搜索建议：返回最相关的前 N 个标题 */
  async suggest(q: string, limit = 6): Promise<string[]> {
    const query = q.trim();
    if (!query) return [];
    const m =
      'MATCH(article.title, article.summary, article.content) AGAINST (:q IN NATURAL LANGUAGE MODE)';
    try {
      const rows = await this.repo
        .createQueryBuilder('article')
        .select('article.title', 'title')
        .addSelect(m, 'score')
        .where('article.status = :status', { status: 'published' })
        .andWhere(`${m} > 0`)
        .setParameter('q', query)
        .orderBy('score', 'DESC')
        .limit(limit)
        .getRawMany();
      if (rows.length) return rows.map((r) => r.title);
    } catch {
      /* 忽略，走下方 LIKE 兜底 */
    }
    const likeRows = await this.repo
      .createQueryBuilder('article')
      .select('article.title', 'title')
      .where('article.status = :status', { status: 'published' })
      .andWhere('article.title LIKE :kw', { kw: `%${query}%` })
      .limit(limit)
      .getRawMany();
    return likeRows.map((r) => r.title);
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** 对文本中的关键字进行高亮（先转义再包裹 <mark>，避免 XSS） */
  private highlight(text: string, q: string): string {
    const safe = this.escapeHtml(text);
    const safeQ = this.escapeHtml(q).trim();
    if (!safeQ) return safe;
    const re = new RegExp(safeQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return safe.replace(re, (matched) => `<mark>${matched}</mark>`);
  }

  /** 生成关键字附近的内容摘要片段并高亮 */
  private makeSnippet(content: string, q: string, len = 160): string {
    const plain = content.replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    const idx = plain.toLowerCase().indexOf(q.toLowerCase());
    let start = 0;
    if (idx >= 0) start = Math.max(0, idx - 40);
    const slice =
      (start > 0 ? '…' : '') +
      plain.slice(start, start + len) +
      (start + len < plain.length ? '…' : '');
    return this.highlight(slice, q);
  }
}
