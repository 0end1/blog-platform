import { IsEmail, IsString, IsIn, MinLength, MaxLength, Matches } from 'class-validator';
import { Role, UserStatus } from '@blog/shared';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码至少包含字母与数字',
  })
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

/** 管理员调整角色 */
export class UpdateRoleDto {
  @IsIn([Role.ADMIN, Role.AUTHOR, Role.READER])
  role: Role;
}

/** 管理员启用/禁用账号 */
export class UpdateStatusDto {
  @IsIn(['active', 'disabled'] as UserStatus[])
  status: UserStatus;
}
