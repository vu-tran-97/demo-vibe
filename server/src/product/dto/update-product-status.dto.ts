import { IsIn } from 'class-validator';

export class UpdateProductStatusDto {
  @IsIn(['DRAFT', 'ACTV', 'SOLD_OUT', 'HIDDEN'])
  status: string;
}
