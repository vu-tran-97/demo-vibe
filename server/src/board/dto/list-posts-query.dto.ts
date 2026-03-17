import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class ListPostsQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsIn(['NOTICE', 'FREE', 'QNA', 'REVIEW'])
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'views', 'comments'])
  sort?: string;
}
