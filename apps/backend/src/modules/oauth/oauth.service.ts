import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import {
  OAuthProviderConfig,
  OAuthProviderName,
  getProviderConfig,
} from './providers';

export interface OAuthProfile {
  provider: OAuthProviderName;
  providerId: string;
  email: string;
  username: string;
  avatar?: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  /** 防 CSRF 的 state 暂存（进程内；生产可换 Redis） */
  private readonly states = new Map<string, number>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /** 该 provider 是否已配置（有 clientId/secret） */
  isEnabled(provider: OAuthProviderName): boolean {
    return !!getProviderConfig(provider);
  }

  /** 生成授权跳转 URL，并登记 state 防 CSRF */
  getAuthorizeUrl(provider: OAuthProviderName): string {
    const cfg = this.requireConfig(provider);
    const state = randomBytes(16).toString('hex');
    this.states.set(state, Date.now() + 10 * 60 * 1000);

    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.callbackUrl,
      scope: cfg.scope,
      state,
      response_type: 'code',
    });
    if (provider === 'github') params.set('allow_signup', 'true');
    return `${cfg.authorizeUrl}?${params.toString()}`;
  }

  /** OAuth 登录回调：换取令牌→取用户→upsert→签发 JWT */
  async handleLogin(provider: OAuthProviderName, code: string, state?: string) {
    this.verifyState(state);
    const profile = await this.fetchProfile(provider, code);
    const user = await this.userService.upsertByOAuth(profile);
    return this.authService.loginWithUser(user);
  }

  /** OAuth 绑定回调：换取令牌→取用户→绑定到当前账号 */
  async handleBind(
    provider: OAuthProviderName,
    code: string,
    state: string | undefined,
    userId: string,
  ) {
    this.verifyState(state);
    const profile = await this.fetchProfile(provider, code);
    await this.userService.bindSocial(userId, provider, profile.providerId);
    return { provider, bound: true };
  }

  // ---- 内部实现 ----

  private requireConfig(provider: OAuthProviderName): OAuthProviderConfig {
    const cfg = getProviderConfig(provider);
    if (!cfg) {
      throw new Error(`OAuth provider '${provider}' 未配置（缺少 clientId/clientSecret）`);
    }
    return cfg;
  }

  private verifyState(state?: string) {
    if (!state || !this.states.has(state)) {
      throw new Error('无效的 OAuth state 或已过期');
    }
    this.states.delete(state);
  }

  private async exchangeToken(cfg: OAuthProviderConfig, code: string): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.callbackUrl,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`令牌交换失败：HTTP ${res.status}`);
    }
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new Error('令牌交换失败：未返回 access_token');
    }
    return data.access_token;
  }

  private async fetchProfile(provider: OAuthProviderName, code: string): Promise<OAuthProfile> {
    const cfg = this.requireConfig(provider);
    const accessToken = await this.exchangeToken(cfg, code);

    if (provider === 'github') {
      const userRes = await fetch(cfg.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
      const u = (await userRes.json()) as {
        id: number;
        login: string;
        email: string | null;
        avatar_url: string;
      };
      let email = u.email;
      if (!email) {
        // GitHub 邮箱可能私有，需单独拉取主邮箱
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        });
        const emails = (await emailRes.json()) as { email: string; primary: boolean; verified: boolean }[];
        email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? '';
      }
      return {
        provider: 'github',
        providerId: String(u.id),
        email: email || `${u.login}@users.noreply.github.com`,
        username: u.login,
        avatar: u.avatar_url,
      };
    }

    // Google
    const userRes = await fetch(cfg.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const g = (await userRes.json()) as {
      sub: string;
      email: string;
      name: string;
      picture: string;
    };
    return {
      provider: 'google',
      providerId: g.sub,
      email: g.email,
      username: g.name || g.email.split('@')[0],
      avatar: g.picture,
    };
  }
}
