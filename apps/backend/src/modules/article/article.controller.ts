import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleQueryDto } from './dto/article.dto';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  list(@Query() query: ArticleQueryDto) {
    return this.articleService.list(query);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articleService.findBySlug(slug);
  }
}
