import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@blog/shared';
import { AccessJwtAuthGuard } from '../auth/guards/access-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { AdminService } from './admin.service';
import { ModerateCommentDto, BulkModerateDto, CreateSensitiveWordDto } from './dto/admin.dto';
import { ArticleQueryDto } from '../article/dto/article.dto';
import { ArticleUpsertDto } from './dto/article-admin.dto';
import { CommentStatus } from '../comment/comment.service';

@Controller('admin')
@UseGuards(AccessJwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('articles')
  articles(@Query() query: ArticleQueryDto) {
    return this.adminService.listArticles(query);
  }

  @Post('articles')
  @Audit('article.create', 'article')
  create(@Body() dto: ArticleUpsertDto, @GetCurrentUser('sub') authorId: string) {
    return this.adminService.createArticle(dto, authorId);
  }

  @Put('articles/:id')
  @Audit('article.update', 'article')
  update(@Param('id') id: string, @Body() dto: ArticleUpsertDto) {
    return this.adminService.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  @Audit('article.delete', 'article')
  remove(@Param('id') id: string) {
    return this.adminService.removeArticle(id);
  }

  @Get('comments')
  comments(@Query('status') status?: CommentStatus) {
    return this.adminService.listComments(status);
  }

  @Put('comments/:id/moderate')
  @Audit('comment.moderate', 'comment')
  moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return this.adminService.moderateComment(id, dto.status);
  }

  @Post('comments/bulk-moderate')
  @Audit('comment.bulkModerate', 'comment')
  bulkModerate(@Body() dto: BulkModerateDto) {
    return this.adminService.bulkModerateComments(dto.ids, dto.status);
  }

  @Get('sensitive-words')
  sensitiveWords() {
    return this.adminService.listSensitiveWords();
  }

  @Post('sensitive-words')
  @Audit('sensitive_word.create', 'sensitive_word')
  createSensitiveWord(@Body() dto: CreateSensitiveWordDto) {
    return this.adminService.addSensitiveWord(dto.word);
  }

  @Delete('sensitive-words/:id')
  @Audit('sensitive_word.delete', 'sensitive_word')
  removeSensitiveWord(@Param('id') id: string) {
    return this.adminService.removeSensitiveWord(id);
  }

  /** 审计日志查询（S4-04） */
  @Get('audit-logs')
  auditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.adminService.listAuditLogs({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      action,
      actorId,
    });
  }
}
