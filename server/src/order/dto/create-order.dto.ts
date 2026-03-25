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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Order items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shipAddr?: string;

  @ApiPropertyOptional({ description: 'Receiver name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shipRcvrNm?: string;

  @ApiPropertyOptional({ description: 'Receiver phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shipTelno?: string;

  @ApiPropertyOptional({ description: 'Shipping memo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  shipMemo?: string;
}
