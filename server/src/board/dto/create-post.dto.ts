import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My first post', description: 'Post title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  postTtl: string;

  @ApiProperty({ example: 'Post content here...', description: 'Post content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  postCn: string;

  @ApiProperty({ enum: ['NOTICE', 'FREE', 'QNA', 'REVIEW'], description: 'Post category code' })
  @IsString()
  @IsIn(['NOTICE', 'FREE', 'QNA', 'REVIEW'])
  postCtgrCd: string;

  @ApiPropertyOptional({ type: [String], description: 'Search tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  srchTags?: string[];
}
