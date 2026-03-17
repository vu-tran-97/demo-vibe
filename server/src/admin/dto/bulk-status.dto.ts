import { IsArray, ArrayMinSize, IsString, IsIn } from 'class-validator';

export class BulkStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  @IsIn(['ACTV', 'SUSP'])
  status: string;
}
