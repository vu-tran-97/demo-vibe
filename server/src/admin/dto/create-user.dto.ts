import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'newuser@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss1', description: 'Initial password' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'johndoe', description: 'Display nickname' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;

  @ApiProperty({ enum: ['SELLER', 'BUYER'], description: 'User role' })
  @IsIn(['SELLER', 'BUYER'])
  role: string;
}
