import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class BulkStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds: string[];

  @IsString()
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;
}
