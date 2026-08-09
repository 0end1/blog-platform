import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEntity } from './article.entity';
import { TagEntity } from '../tag/tag.entity';
import { ArticleQueryDto } from './dto/article.dto';
import { ArticleUpsertDto } from '../admin/dto/article-admin.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly repo: Repository<ArticleEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
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

  /** 后台创建文章 */
  async adminCreate(dto: ArticleUpsertDto, authorId: string) {
    const exists = await this.repo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new BadRequestException('slug 已存在');

    const status = dto.status ?? 'draft';
    const article = this.repo.create({
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      content: dto.content,
      cover: dto.cover,
      status,
      categoryId: dto.categoryId ?? null,
      authorId,
      publishedAt: status === 'published' ? new Date() : undefined,
      scheduledPublishAt:
        status === 'scheduled' && dto.scheduledPublishAt
          ? new Date(dto.scheduledPublishAt)
          : null,
    });
    if (dto.tagIds?.length) {
      article.tags = await this.tagRepo.findByIds(dto.tagIds);
    }
    return this.repo.save(article);
  }

  /** 后台更新文章 */
  async adminUpdate(id: string, dto: ArticleUpsertDto) {
    const article = await this.repo.findOne({ where: { id } });
    if (!article) throw new NotFoundException('文章不存在');

    if (dto.slug && dto.slug !== article.slug) {
      const dup = await this.repo.findOne({ where: { slug: dto.slug } });
      if (dup) throw new BadRequestException('slug 已存在');
    }

    const status = dto.status ?? article.status;
    Object.assign(article, {
      title: dto.title,
      slug: dto.slug,
      summary: dto.summary,
      content: dto.content,
      cover: dto.cover,
      status,
      categoryId: dto.categoryId ?? null,
    });
    if (status === 'published' && !article.publishedAt) {
      article.publishedAt = new Date();
    }
    if (status === 'scheduled' && dto.scheduledPublishAt) {
      article.scheduledPublishAt = new Date(dto.scheduledPublishAt);
    }
    if (status !== 'scheduled') {
      article.scheduledPublishAt = null;
    }
    if (dto.tagIds) {
      article.tags = await this.tagRepo.findByIds(dto.tagIds);
    }
    return this.repo.save(article);
  }

  /** 后台删除文章 */
  async adminRemove(id: string) {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('文章不存在');
    return { id };
  }
}
