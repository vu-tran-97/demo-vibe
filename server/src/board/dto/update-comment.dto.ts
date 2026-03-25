import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment', description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  cmntCn: string;
}
