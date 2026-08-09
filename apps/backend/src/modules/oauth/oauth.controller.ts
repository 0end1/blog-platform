import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Req,
  Delete,
  UseGuards,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { OAuthService } from './oauth.service';
import { isSupportedProvider, loginRedirectUrl, bindRedirectUrl } from './providers';
import { UserService } from '../user/user.service';
import { AccessJwtAuthGuard } from '../auth/guards/access-jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';

@Controller('auth/oauth')
export class OAuthController {
  constructor(
    private readonly oauth: OAuthService,
    private readonly userService: UserService,
    private readonly jwt: JwtService,
  ) {}

  /** 发起第三方登录（未配置时返回 501） */
  @Get(':provider')
  start(@Param('provider') provider: string, @Res() res: Response) {
    if (!isSupportedProvider(provider)) {
      return res.status(404).send('不支持的 OAuth 提供方');
    }
    if (!this.oauth.isEnabled(provider)) {
      return res.status(501).send('OAuth 未配置（缺少 clientId/clientSecret）');
    }
    return res.redirect(this.oauth.getAuthorizeUrl(provider));
  }

  /** 第三方回调：登录或绑定 */
  @Get(':provider/callback')
  @Audit('oauth.login', 'oauth')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!isSupportedProvider(provider)) {
      return res.status(404).send('不支持的 OAuth 提供方');
    }
    try {
      const bindUid = this.getCookie(req, 'oauth_bind_uid');
      if (bindUid) {
        await this.oauth.handleBind(provider, code, state, bindUid);
        res.clearCookie('oauth_bind_uid');
        return res.redirect(bindRedirectUrl());
      }
      const result = await this.oauth.handleLogin(provider, code, state);
      const url =
        `${loginRedirectUrl()}?accessToken=${encodeURIComponent(result.accessToken)}` +
        `&refreshToken=${encodeURIComponent(result.refreshToken)}`;
      return res.redirect(url);
    } catch (e) {
      return res.status(400).send(`OAuth 失败：${(e as Error).message}`);
    }
  }

  /**
   * 已登录用户发起绑定（写入临时 cookie 记录当前用户）。
   * 支持从 Authorization Header 或 ?token= 查询参数取 JWT，
   * 以便浏览器整页跳转到第三方授权页时也能携带身份。
   */
  @Get('bind-start/:provider')
  async bindStart(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = this.resolveUserId(req);
    if (!userId) {
      return res.status(401).send('请先登录');
    }
    if (!isSupportedProvider(provider)) {
      return res.status(404).send('不支持的 OAuth 提供方');
    }
    if (!this.oauth.isEnabled(provider)) {
      return res.status(501).send('OAuth 未配置（缺少 clientId/clientSecret）');
    }
    res.cookie('oauth_bind_uid', userId, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
      sameSite: 'lax',
    });
    return res.redirect(this.oauth.getAuthorizeUrl(provider));
  }

  /** 解绑第三方账号（管理端 API 调用，携带 Authorization Header） */
  @Delete('bind/:provider')
  @UseGuards(AccessJwtAuthGuard)
  @HttpCode(200)
  @Audit('oauth.unbind', 'oauth')
  async unbind(
    @Param('provider') provider: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    if (!isSupportedProvider(provider)) {
      throw new NotFoundException('不支持的 OAuth 提供方');
    }
    if (!this.oauth.isEnabled(provider)) {
      throw new BadRequestException('OAuth 未配置');
    }
    await this.userService.unbindSocial(userId, provider);
    return { unbound: true };
  }

  private resolveUserId(req: Request): string | null {
    let token: string | undefined;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }
    if (!token) return null;
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      }) as { sub?: string };
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  private getCookie(req: Request, name: string): string | undefined {
    const raw = req.headers.cookie;
    if (!raw) return undefined;
    const found = raw
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${name}=`));
    return found ? decodeURIComponent(found.slice(name.length + 1)) : undefined;
  }
}
