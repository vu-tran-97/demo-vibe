import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  cmntCn: string;

  @IsOptional()
  @IsString()
  prntCmntId?: string;
}
