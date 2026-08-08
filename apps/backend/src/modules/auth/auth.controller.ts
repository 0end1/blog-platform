import { Controller, Post, Body, UseGuards, Get, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto, LoginDto } from '../user/dto/user.dto';
import { RefreshDto } from './dto/auth.dto';
import { AccessJwtAuthGuard } from './guards/access-jwt-auth.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';
import { GetCurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './strategies/access-jwt.strategy';

/**
 * 认证模块（Sprint 1 实现：邮箱注册/登录/JWT 双令牌/刷新/退出/当前用户）
 * OAuth（GitHub/Google）在 Sprint 4 实现。
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(RefreshJwtAuthGuard)
  @HttpCode(200)
  refresh(@GetCurrentUser() user: JwtPayload, @Body() _dto: RefreshDto) {
    // refresh 令牌已由 RefreshJwtAuthGuard 校验，此处仅旋转令牌
    return this.authService.refresh(user);
  }

  @Get('me')
  @UseGuards(AccessJwtAuthGuard)
  async me(@GetCurrentUser('sub') userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      return null;
    }
    const { password: _password, ...safe } = user as unknown as Record<string, unknown> & {
      password?: string;
    };
    return safe;
  }

  @Post('logout')
  @UseGuards(AccessJwtAuthGuard)
  @HttpCode(200)
  logout() {
    // MVP：前端丢弃令牌即可；刷新令牌撤销（Redis 黑名单）为 Sprint 4 安全加固项
    return { loggedOut: true };
  }
}
