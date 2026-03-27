import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListProductsQueryDto {
  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '12', description: 'Items per page' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'], description: 'Filter by status' })
  @IsOptional()
  @IsIn(['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'])
  status?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['newest', 'price-low', 'price-high', 'popular', 'rating'], description: 'Sort order' })
  @IsOptional()
  @IsIn(['newest', 'price-low', 'price-high', 'popular', 'rating'])
  sort?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @ApiPropertyOptional({ description: 'Minimum rating filter' })
  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @ApiPropertyOptional({ description: 'Filter in-stock only' })
  @IsOptional()
  @IsString()
  inStock?: string;

  @ApiPropertyOptional({ description: 'Comma-separated category codes' })
  @IsOptional()
  @IsString()
  categories?: string;
}
