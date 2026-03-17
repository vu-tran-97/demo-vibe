import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
