import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';
import { SensitiveWordService } from '../moderation/sensitive-word.service';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repo: Repository<CommentEntity>,
    private readonly sensitiveWord: SensitiveWordService,
  ) {}

  listByArticle(articleId: string) {
    return this.repo.find({
      where: { articleId, status: 'approved' },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  /** 发表评论（支持 parentId 多级回复）。命中敏感词则转人工审核(pending)。 */
  async create(dto: {
    articleId: string;
    authorId: string;
    content: string;
    parentId?: string | null;
  }) {
    const hit = await this.sensitiveWord.match(dto.content);
    const status: CommentStatus = hit ? 'pending' : 'approved';
    const comment = this.repo.create({
      articleId: dto.articleId,
      authorId: dto.authorId,
      content: dto.content,
      parentId: dto.parentId ?? null,
      status,
    });
    return this.repo.save(comment);
  }

  /** 后台：列出全部评论，可按状态筛选 */
  listAll(status?: CommentStatus) {
    const where = status ? { status } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  /** 后台：审核通过/驳回/待审 */
  async moderate(id: string, status: CommentStatus) {
    const comment = await this.repo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('评论不存在');
    comment.status = status;
    return this.repo.save(comment);
  }
}
