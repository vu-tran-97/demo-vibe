import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  MaxLength,
} from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  postTtl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  postCn?: string;

  @IsOptional()
  @IsString()
  @IsIn(['NOTICE', 'FREE', 'QNA', 'REVIEW'])
  postCtgrCd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  srchTags?: string[];
}
