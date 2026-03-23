import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email to send password reset link' })
  @IsEmail()
  @MaxLength(100)
  email!: string;
}
