import { IsEmail, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @ApiProperty({ example: 'StrongP@ss1', description: 'User password' })
  @IsString()
  password!: string;
}
