import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto, SuggestQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search products and posts' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async search(@Query() query: SearchQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '12', 10), 50);
    return this.searchService.search(query.q, page, limit);
  }

  @Get('suggest')
  @Public()
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved' })
  async suggest(@Query() query: SuggestQueryDto) {
    return this.searchService.suggest(query.q);
  }
}
