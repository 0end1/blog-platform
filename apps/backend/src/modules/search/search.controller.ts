import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** GET /api/v1/search?q=关键字&page=&pageSize= */
  @Get()
  search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  /** GET /api/v1/search/suggest?q=关键字 */
  @Get('suggest')
  suggest(@Query('q') q: string) {
    return this.searchService.suggest(q ?? '');
  }
}
