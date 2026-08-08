import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from './article.entity';
import { ArticleQueryDto } from './dto/article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly repo: Repository<ArticleEntity>,
  ) {}

  /** 公开列表：默认仅返回已发布，支持分类/标签/关键字筛选与分页 */
  async list(query: ArticleQueryDto) {
    const qb = this.repo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.author', 'author')
      .orderBy('article.createdAt', 'DESC');

    const status = query.status ?? 'published';
    qb.andWhere('article.status = :status', { status });

    if (query.category) {
      qb.andWhere('category.slug = :category', { category: query.category });
    }
    if (query.tag) {
      qb.andWhere('tags.slug = :tag', { tag: query.tag });
    }
    if (query.keyword) {
      qb.andWhere('(article.title LIKE :kw OR article.summary LIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  /** 按别名获取详情，并自增阅读量 */
  async findBySlug(slug: string, incrementView = true) {
    const article = await this.repo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.author', 'author')
      .where('article.slug = :slug', { slug })
      .getOne();

    if (!article) throw new NotFoundException('文章不存在');

    if (incrementView) {
      article.viewCount += 1;
      await this.repo.save(article);
    }
    return article;
  }

  /** 后台列表：不强制 published，可按状态筛选，含草稿 */
  async adminList(query: ArticleQueryDto) {
    const qb = this.repo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.author', 'author')
      .orderBy('article.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('article.status = :status', { status: query.status });
    }
    if (query.category) {
      qb.andWhere('category.slug = :category', { category: query.category });
    }
    if (query.tag) {
      qb.andWhere('tags.slug = :tag', { tag: query.tag });
    }
    if (query.keyword) {
      qb.andWhere('(article.title LIKE :kw OR article.summary LIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }
}
