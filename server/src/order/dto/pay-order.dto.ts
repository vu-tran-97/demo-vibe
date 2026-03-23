import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayOrderDto {
  @ApiProperty({ enum: ['BANK_TRANSFER', 'EMAIL_INVOICE'], description: 'Payment method' })
  @IsString()
  @IsIn(['BANK_TRANSFER', 'EMAIL_INVOICE'])
  paymentMethod: string;
}
