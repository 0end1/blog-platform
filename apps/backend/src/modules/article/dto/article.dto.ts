import { IsOptional, IsInt, IsIn, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleQueryDto {
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

  /** 按分类别名筛选 */
  @IsOptional()
  @IsString()
  category?: string;

  /** 按标签别名筛选 */
  @IsOptional()
  @IsString()
  tag?: string;

  /** 标题/摘要关键字搜索 */
  @IsOptional()
  @IsString()
  keyword?: string;

  /** 状态筛选（后台可用；公开列表默认 published） */
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';
}
