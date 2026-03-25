import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListPostsQueryDto {
  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '20', description: 'Items per page' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ enum: ['NOTICE', 'FREE', 'QNA', 'REVIEW'], description: 'Filter by category' })
  @IsOptional()
  @IsIn(['NOTICE', 'FREE', 'QNA', 'REVIEW'])
  category?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['newest', 'views', 'comments'], description: 'Sort order' })
  @IsOptional()
  @IsIn(['newest', 'views', 'comments'])
  sort?: string;
}
