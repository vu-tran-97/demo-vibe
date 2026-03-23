import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '20', description: 'Items per page' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ enum: ['SUPER_ADMIN', 'SELLER', 'BUYER'], description: 'Filter by role' })
  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'SELLER', 'BUYER'])
  role?: string;

  @ApiPropertyOptional({ enum: ['ACTV', 'SUSP', 'INAC'], description: 'Filter by status' })
  @IsOptional()
  @IsIn(['ACTV', 'SUSP', 'INAC'])
  status?: string;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
