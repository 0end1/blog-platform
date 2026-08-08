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
import { ArticleQueryDto } from '../article/dto/article.dto';

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
  ) {}

  /** 后台仪表盘统计 */
  async dashboard() {
    const [
      articleCount,
      publishedArticleCount,
      commentCount,
      pendingCommentCount,
      userCount,
      categoryCount,
      tagCount,
    ] = await Promise.all([
      this.articleRepo.count(),
      this.articleRepo.count({ where: { status: 'published' } }),
      this.commentRepo.count(),
      this.commentRepo.count({ where: { status: 'pending' } }),
      this.userRepo.count(),
      this.categoryRepo.count(),
      this.tagRepo.count(),
    ]);

    const viewRaw = await this.articleRepo
      .createQueryBuilder('a')
      .select('SUM(a.viewCount)', 'v')
      .getRawOne();
    const todayViewCount = Number(viewRaw?.v ?? 0);

    return {
      articleCount,
      publishedArticleCount,
      commentCount,
      pendingCommentCount,
      userCount,
      categoryCount,
      tagCount,
      todayViewCount,
    };
  }

  /** 后台文章列表（含草稿） */
  async listArticles(query: ArticleQueryDto) {
    return this.articleService.adminList(query);
  }

  /** 后台评论列表 */
  listComments(status?: CommentStatus) {
    return this.commentService.listAll(status);
  }

  /** 审核评论 */
  moderateComment(id: string, status: CommentStatus) {
    return this.commentService.moderate(id, status);
  }
}
