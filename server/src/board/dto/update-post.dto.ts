import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated title', description: 'Post title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  postTtl?: string;

  @ApiPropertyOptional({ example: 'Updated content', description: 'Post content' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  postCn?: string;

  @ApiPropertyOptional({ enum: ['NOTICE', 'FREE', 'QNA', 'REVIEW'], description: 'Post category code' })
  @IsOptional()
  @IsString()
  @IsIn(['NOTICE', 'FREE', 'QNA', 'REVIEW'])
  postCtgrCd?: string;

  @ApiPropertyOptional({ type: [String], description: 'Search tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  srchTags?: string[];
}
