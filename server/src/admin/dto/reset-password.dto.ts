import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewStr0ng!Pass', description: 'New password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  password: string;
}
