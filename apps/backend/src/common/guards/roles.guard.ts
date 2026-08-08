import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@blog/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** 基于角色的访问控制：要求请求用户角色命中声明角色之一 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.role) throw new ForbiddenException('未认证或角色缺失');

    const allowed = requiredRoles.some((role) => user.role === role);
    if (!allowed) throw new ForbiddenException('无权访问该资源');
    return allowed;
  }
}
