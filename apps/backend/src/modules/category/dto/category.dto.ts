import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @MaxLength(60)
  slug: string;

  /** 父分类 ID，留空表示一级分类 */
  @IsOptional()
  parentId?: string | null;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  slug?: string;

  @IsOptional()
  parentId?: string | null;
}

/** 列表查询参数 */
export class CategoryQueryDto {
  @IsOptional()
  @IsIn(['all', 'top'])
  scope?: 'all' | 'top';
}
