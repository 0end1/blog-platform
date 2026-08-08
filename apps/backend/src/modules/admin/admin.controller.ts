import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { Role } from '@blog/shared';
import { AccessJwtAuthGuard } from '../auth/guards/access-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ModerateCommentDto } from './dto/admin.dto';
import { ArticleQueryDto } from '../article/dto/article.dto';
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

  @Get('comments')
  comments(@Query('status') status?: CommentStatus) {
    return this.adminService.listComments(status);
  }

  @Put('comments/:id/moderate')
  moderate(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return this.adminService.moderateComment(id, dto.status);
  }
}
