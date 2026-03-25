import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  IsIn,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Handmade Ceramic Vase', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  prdNm: string;

  @ApiProperty({ example: 'A beautiful handmade ceramic vase', description: 'Product description' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  prdDc: string;

  @ApiProperty({ example: 45000, description: 'Product price' })
  @IsNumber()
  @Min(0)
  prdPrc: number;

  @ApiPropertyOptional({ example: 39000, description: 'Sale price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prdSalePrc?: number;

  @ApiProperty({ enum: ['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'], description: 'Product category code' })
  @IsString()
  @IsIn(['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'])
  prdCtgrCd: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTV'], description: 'Product status code' })
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTV'])
  prdSttsCd?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Main product image URL' })
  @IsString()
  @IsNotEmpty()
  prdImgUrl: string;

  @ApiPropertyOptional({ type: [String], description: 'Additional product image URLs (max 5)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  prdImgUrls?: string[];

  @ApiProperty({ example: 100, description: 'Stock quantity' })
  @IsInt()
  @Min(0)
  stckQty: number;

  @ApiPropertyOptional({ type: [String], description: 'Search tags' })
  @IsOptional()
  @IsArray()
  srchTags?: string[];
}
