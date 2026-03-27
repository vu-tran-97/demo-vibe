import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductStatusDto {
  @ApiProperty({ enum: ['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'], description: 'New product status' })
  @IsIn(['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'])
  status: string;
}
