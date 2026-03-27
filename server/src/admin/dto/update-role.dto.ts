import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['SELLER', 'BUYER'], description: 'New user role' })
  @IsIn(['SELLER', 'BUYER'])
  role: string;
}
