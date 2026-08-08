import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Role } from '@blog/shared';
import { AccessJwtAuthGuard } from '../auth/guards/access-jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserService } from './user.service';
import { UpdateRoleDto, UpdateStatusDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 注册预检：邮箱/用户名是否可用 */
  @Get('check/availability')
  checkAvailability(@Query('email') email?: string, @Query('username') username?: string) {
    return this.userService.checkAvailability(email, username);
  }

  /** 用户列表（仅管理员） */
  @Get()
  @UseGuards(AccessJwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.userService.findMany();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  /** 修改角色（仅管理员） */
  @Put(':id/role')
  @UseGuards(AccessJwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.userService.updateRole(id, dto.role);
  }

  /** 启用/禁用账号（仅管理员） */
  @Put(':id/status')
  @UseGuards(AccessJwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.userService.updateStatus(id, dto.status);
  }

  /** 删除用户（仅管理员，禁止删除自己） */
  @Delete(':id')
  @UseGuards(AccessJwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(200)
  remove(@Param('id') id: string, @GetCurrentUser('sub') currentId: string) {
    if (id === currentId) {
      return { error: '不能删除当前登录账号' };
    }
    return this.userService.remove(id);
  }
}
