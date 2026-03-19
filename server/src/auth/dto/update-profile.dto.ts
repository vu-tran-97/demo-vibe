import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9가-힣_ ]+$/, {
    message:
      'Nickname can only contain Korean, English, numbers, underscore, and space',
  })
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Profile image URL must be a valid URL' })
  profileImageUrl?: string;
}
