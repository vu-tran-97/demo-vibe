import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], description: 'New order status' })
  @IsString()
  @IsIn(['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status: string;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
