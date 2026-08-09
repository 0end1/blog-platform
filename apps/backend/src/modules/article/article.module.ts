import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './article.entity';
import { TagEntity } from '../tag/tag.entity';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { ScheduledPublishService } from './scheduled-publish.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, TagEntity])],
  controllers: [ArticleController],
  providers: [ArticleService, ScheduledPublishService],
  exports: [ArticleService, ScheduledPublishService],
})
export class ArticleModule {}
