import { Global, Module } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';

/** 全局公共能力：RBAC 守卫等，供各业务模块直接注入使用 */
@Global()
@Module({
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class CommonModule {}
