export type OAuthProviderName = 'github' | 'google';

export interface OAuthProviderConfig {
  name: OAuthProviderName;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

/** 登录成功后重定向到前端的地址（携带 token 查询参数） */
export function loginRedirectUrl(): string {
  return process.env.OAUTH_LOGIN_REDIRECT || 'http://localhost:3002/oauth-callback';
}

/** 绑定成功后重定向到前端的地址 */
export function bindRedirectUrl(): string {
  return process.env.OAUTH_BIND_REDIRECT || 'http://localhost:3002/account';
}

/**
 * 从环境变量读取 OAuth 提供方配置（S4-01 脚手架）。
 * 未配置 clientId / clientSecret 时返回 null，表示该功能未启用。
 */
export function getProviderConfig(
  provider: OAuthProviderName,
): OAuthProviderConfig | null {
  const base = 'http://localhost:3000/api/v1/auth/oauth';
  const callbackUrl = (p: OAuthProviderName) => `${base}/${p}/callback`;

  if (provider === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      name: 'github',
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scope: 'read:user user:email',
      clientId,
      clientSecret,
      callbackUrl: process.env.GITHUB_CALLBACK_URL || callbackUrl('github'),
    };
  }

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      name: 'google',
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
      scope: 'openid email profile',
      clientId,
      clientSecret,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || callbackUrl('google'),
    };
  }

  return null;
}

export function isSupportedProvider(p: string): p is OAuthProviderName {
  return p === 'github' || p === 'google';
}
