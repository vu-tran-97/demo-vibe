import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'price-low', 'price-high', 'popular', 'rating'])
  sort?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @IsOptional()
  @IsString()
  inStock?: string;

  @IsOptional()
  @IsString()
  categories?: string;
}
