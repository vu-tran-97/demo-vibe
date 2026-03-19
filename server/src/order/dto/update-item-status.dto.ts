import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class UpdateItemStatusDto {
  @IsString()
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;
}
