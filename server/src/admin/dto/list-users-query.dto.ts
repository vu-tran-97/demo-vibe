import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'SELLER', 'BUYER'])
  role?: string;

  @IsOptional()
  @IsIn(['ACTV', 'SUSP', 'INAC'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
