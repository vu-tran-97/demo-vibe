import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  cmntCn: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  prntCmntId?: number;
}
