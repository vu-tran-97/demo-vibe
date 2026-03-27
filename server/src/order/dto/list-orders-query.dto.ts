import { IsOptional, IsNumberString, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '20', description: 'Items per page' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], description: 'Filter by order status' })
  @IsOptional()
  @IsIn([
    'PENDING',
    'PAID',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ])
  status?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], description: 'Filter by item status' })
  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  itemStatus?: string;

  @ApiPropertyOptional({ enum: ['UNPAID', 'PAID'], description: 'Filter by payment status' })
  @IsOptional()
  @IsIn(['UNPAID', 'PAID'])
  paymentStatus?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Start date filter' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'End date filter' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
