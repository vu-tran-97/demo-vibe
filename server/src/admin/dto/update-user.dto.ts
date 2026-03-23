import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Full name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'janedoe', description: 'Display nickname' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;
}
