import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkStatusDto {
  @ApiProperty({ type: [String], description: 'Item IDs to update' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds: string[];

  @ApiProperty({ enum: ['CONFIRMED', 'SHIPPED', 'DELIVERED'], description: 'New status' })
  @IsString()
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED'])
  status: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;
}
