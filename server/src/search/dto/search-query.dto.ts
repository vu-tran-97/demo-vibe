import { IsNotEmpty, IsOptional, IsString, MinLength, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ example: 'ceramic', description: 'Search keyword (min 2 chars)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  q!: string;

  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '12', description: 'Items per page (max 50)' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class SuggestQueryDto {
  @ApiProperty({ example: 'cer', description: 'Search suggestion keyword (min 1 char)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  q!: string;
}
