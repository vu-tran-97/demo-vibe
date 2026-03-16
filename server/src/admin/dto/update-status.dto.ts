import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['ACTV', 'SUSP', 'INAC'])
  status: string;
}
