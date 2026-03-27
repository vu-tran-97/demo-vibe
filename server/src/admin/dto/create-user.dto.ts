import { IsEmail, IsString, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'newuser@example.com', description: 'User email' })
  @IsEmail()
  email: string;

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
