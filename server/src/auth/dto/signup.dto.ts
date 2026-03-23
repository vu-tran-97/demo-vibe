import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @ApiProperty({ example: 'StrongP@ss1', description: 'Password (min 8 chars, must include upper, lower, number, special)' })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
    {
      message:
        'Password must contain at least one uppercase, one lowercase, one number, and one special character',
    },
  )
  password!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ example: 'johndoe', description: 'Display nickname' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9가-힣_ ]+$/, {
    message:
      'Nickname can only contain Korean, English, numbers, underscore, and space',
  })
  nickname?: string;

  @ApiPropertyOptional({ enum: ['BUYER', 'SELLER'], description: 'User role' })
  @IsOptional()
  @IsIn(['BUYER', 'SELLER'], {
    message: 'Role must be either BUYER or SELLER',
  })
  role?: 'BUYER' | 'SELLER';
}
