import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { ArticleEntity } from '../article/article.entity';
import { CategoryEntity } from '../category/category.entity';
import { TagEntity } from '../tag/tag.entity';
import { CommentEntity } from '../comment/comment.entity';
import { UserModule } from '../user/user.module';
import { ArticleModule } from '../article/article.module';
import { CategoryModule } from '../category/category.module';
import { TagModule } from '../tag/tag.module';
import { CommentModule } from '../comment/comment.module';
import { ModerationModule } from '../moderation/moderation.module';
import { AuditModule } from '../audit/audit.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ArticleEntity, CategoryEntity, TagEntity, CommentEntity]),
    UserModule,
    ArticleModule,
    CategoryModule,
    TagModule,
    CommentModule,
    ModerationModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
