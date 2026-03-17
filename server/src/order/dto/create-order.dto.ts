import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipAddr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shipRcvrNm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  shipTelno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shipMemo?: string;
}
