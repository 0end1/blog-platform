import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CommentService } from './comment.service';

/**
 * 评论模块（Sprint 3 实现多级/发表/审核）
 */
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('article/:articleId')
  listByArticle(@Param('articleId') articleId: string) {
    return this.commentService.listByArticle(articleId);
  }

  @Post()
  create(
    @Body()
    body: {
      articleId: string;
      authorId: string;
      content: string;
      parentId?: string | null;
    },
  ) {
    return this.commentService.create(body);
  }
}
