import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateBannerDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsBoolean()
  enabled: boolean;
}
