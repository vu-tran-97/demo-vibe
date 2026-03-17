import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto, SuggestQueryDto } from './dto/search-query.dto';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  async search(@Query() query: SearchQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '12', 10), 50);
    return this.searchService.search(query.q, page, limit);
  }

  @Get('suggest')
  @Public()
  async suggest(@Query() query: SuggestQueryDto) {
    return this.searchService.suggest(query.q);
  }
}
