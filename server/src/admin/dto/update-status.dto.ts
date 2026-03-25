import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ enum: ['ACTV', 'SUSP', 'INAC'], description: 'New user status' })
  @IsIn(['ACTV', 'SUSP', 'INAC'])
  status: string;
}
