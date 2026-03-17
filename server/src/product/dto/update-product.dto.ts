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

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  prdNm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  prdDc?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prdPrc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prdSalePrc?: number;

  @IsOptional()
  @IsString()
  @IsIn(['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'])
  prdCtgrCd?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTV'])
  prdSttsCd?: string;

  @IsOptional()
  @IsString()
  prdImgUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  prdImgUrls?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stckQty?: number;

  @IsOptional()
  @IsArray()
  srchTags?: string[];
}
