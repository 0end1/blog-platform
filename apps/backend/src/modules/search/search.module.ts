import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from '../article/article.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
