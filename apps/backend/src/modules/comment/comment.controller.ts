import { Controller, Get, Param } from '@nestjs/common';
import { CommentService } from './comment.service';

/**
 * 评论模块（Sprint 3 实现多级/发表/审核；Sprint 0 占位列表接口）
 */
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('article/:articleId')
  listByArticle(@Param('articleId') articleId: string) {
    return this.commentService.listByArticle(articleId);
  }
}
