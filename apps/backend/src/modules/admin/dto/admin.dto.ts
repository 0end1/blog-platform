import { IsIn, IsString } from 'class-validator';

export class ModerateCommentDto {
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}
