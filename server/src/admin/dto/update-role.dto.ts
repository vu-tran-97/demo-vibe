import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['SELLER', 'BUYER'])
  role: string;
}
