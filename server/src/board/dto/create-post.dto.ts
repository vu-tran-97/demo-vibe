import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  postTtl: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  postCn: string;

  @IsString()
  @IsIn(['NOTICE', 'FREE', 'QNA', 'REVIEW'])
  postCtgrCd: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  srchTags?: string[];
}
