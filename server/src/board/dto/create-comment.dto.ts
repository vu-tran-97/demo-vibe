import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  cmntCn: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsString()
  prntCmntId?: string;
}
