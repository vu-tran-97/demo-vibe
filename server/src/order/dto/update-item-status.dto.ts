import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateItemStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'SHIPPED', 'DELIVERED'], description: 'New item status' })
  @IsString()
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED'])
  status: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;
}
