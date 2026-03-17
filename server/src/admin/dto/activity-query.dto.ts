import { IsOptional, IsNumberString } from 'class-validator';

export class ActivityQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
