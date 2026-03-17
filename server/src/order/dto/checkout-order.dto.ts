import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsString()
  @IsIn(['BANK_TRANSFER', 'EMAIL_INVOICE'])
  paymentMethod: string;

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
