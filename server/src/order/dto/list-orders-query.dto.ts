import { IsOptional, IsNumberString, IsString, IsIn } from 'class-validator';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

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

  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  itemStatus?: string;

  @IsOptional()
  @IsIn(['UNPAID', 'PAID'])
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
