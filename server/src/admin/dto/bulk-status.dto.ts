import { IsArray, ArrayMinSize, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkStatusDto {
  @ApiProperty({ type: [String], description: 'User IDs to update' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ enum: ['ACTV', 'SUSP'], description: 'New status' })
  @IsString()
  @IsIn(['ACTV', 'SUSP'])
  status: string;
}
