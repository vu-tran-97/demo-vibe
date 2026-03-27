import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBannerDto {
  @ApiProperty({ example: 'https://example.com/banner.jpg', description: 'Banner image URL' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'Summer Sale', description: 'Banner title' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: 'Up to 50% off', description: 'Banner subtitle' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @ApiPropertyOptional({ example: 'https://example.com/sale', description: 'Banner link URL' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ example: true, description: 'Whether the banner is enabled' })
  @IsBoolean()
  enabled: boolean;
}
