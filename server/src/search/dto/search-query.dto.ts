import { IsNotEmpty, IsOptional, IsString, MinLength, IsNumberString } from 'class-validator';

export class SearchQueryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  q!: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class SuggestQueryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  q!: string;
}
