import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class ListProductsQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'])
  category?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'price-low', 'price-high', 'popular'])
  sort?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;
}
