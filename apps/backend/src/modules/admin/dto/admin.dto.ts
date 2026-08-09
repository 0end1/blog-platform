import { IsIn, IsString, IsArray } from 'class-validator';

export class ModerateCommentDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}

/** 批量审核评论（S4-03） */
export class BulkModerateDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}

/** 新增敏感词（S4-03） */
export class CreateSensitiveWordDto {
  @IsString()
  word: string;
}
