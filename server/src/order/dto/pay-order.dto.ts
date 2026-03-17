import { IsString, IsIn } from 'class-validator';

export class PayOrderDto {
  @IsString()
  @IsIn(['BANK_TRANSFER', 'EMAIL_INVOICE'])
  paymentMethod: string;
}
