import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  IsIn,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Updated Vase Name', description: 'Product name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  prdNm?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  prdDc?: string;

  @ApiPropertyOptional({ example: 50000, description: 'Product price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prdPrc?: number;

  @ApiPropertyOptional({ example: 42000, description: 'Sale price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prdSalePrc?: number;

  @ApiPropertyOptional({ enum: ['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'], description: 'Product category code' })
  @IsOptional()
  @IsString()
  @IsIn(['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'])
  prdCtgrCd?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTV'], description: 'Product status code' })
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTV'])
  prdSttsCd?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Main product image URL' })
  @IsOptional()
  @IsString()
  prdImgUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'Additional product image URLs (max 5)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  prdImgUrls?: string[];

  @ApiPropertyOptional({ example: 50, description: 'Stock quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stckQty?: number;

  @ApiPropertyOptional({ type: [String], description: 'Search tags' })
  @IsOptional()
  @IsArray()
  srchTags?: string[];
}
