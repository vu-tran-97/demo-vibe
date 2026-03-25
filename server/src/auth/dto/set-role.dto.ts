import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetRoleDto {
  @ApiProperty({ example: 'BUYER', description: 'User role', enum: ['BUYER', 'SELLER'] })
  @IsString()
  @IsIn(['BUYER', 'SELLER'])
  role: 'BUYER' | 'SELLER';
}
