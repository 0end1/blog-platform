import { IsString, IsOptional, IsIn, IsArray, IsUUID } from 'class-validator';

/** 后台文章创建/更新入参 */
export class ArticleUpsertDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsIn(['draft', 'scheduled', 'published'])
  status?: 'draft' | 'scheduled' | 'published';

  @IsOptional()
  @IsString()
  scheduledPublishAt?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
