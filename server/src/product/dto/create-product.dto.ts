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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  prdNm: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  prdDc: string;

  @IsNumber()
  @Min(0)
  prdPrc: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prdSalePrc?: number;

  @IsString()
  @IsIn(['CERAMICS', 'TEXTILES', 'ART', 'JEWELRY', 'HOME', 'FOOD'])
  prdCtgrCd: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTV'])
  prdSttsCd?: string;

  @IsString()
  @IsNotEmpty()
  prdImgUrl: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  prdImgUrls?: string[];

  @IsInt()
  @Min(0)
  stckQty: number;

  @IsOptional()
  @IsArray()
  srchTags?: string[];
}
