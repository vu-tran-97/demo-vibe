import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Full name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'janedoe', description: 'Display nickname' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9가-힣_ ]+$/, {
    message:
      'Nickname can only contain Korean, English, numbers, underscore, and space',
  })
  nickname?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Profile image URL must be a valid URL' })
  profileImageUrl?: string;
}
