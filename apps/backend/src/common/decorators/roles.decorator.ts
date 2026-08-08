import { SetMetadata } from '@nestjs/common';
import { Role } from '@blog/shared';

export const ROLES_KEY = 'roles';

/** 在控制器或路由上声明允许访问的角色；未声明则放行 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
