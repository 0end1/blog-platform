import { IsOptional, IsInt, IsString, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  /** 搜索关键字（必填，至少 1 个字符） */
  @IsString()
  @MinLength(1)
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;
}
