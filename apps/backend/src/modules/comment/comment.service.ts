import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repo: Repository<CommentEntity>,
  ) {}

  listByArticle(articleId: string) {
    return this.repo.find({
      where: { articleId, status: 'approved' },
      order: { createdAt: 'ASC' },
    });
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
