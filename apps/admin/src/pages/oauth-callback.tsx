import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { User } from '@blog/shared';

const EMPTY_USER: User = {
  id: '',
  username: '',
  email: '',
  role: 'reader',
  status: 'active',
  createdAt: '',
  updatedAt: '',
};

/** OAuth 登录回调页：后端重定向携带 token，本页写入登录态并跳转仪表盘 */
export function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken) return;

    (async () => {
      try {
        // 先写入令牌以便后续请求携带
        setAuth(accessToken, EMPTY_USER);
        const me = await authApi.me();
        // refreshToken 仅作占位记录，管理端主要使用 accessToken
        void refreshToken;
        setAuth(accessToken, me);
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/login', { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasToken = params.get('accessToken');
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {hasToken ? (
        <Spin tip="登录中..." size="large" />
      ) : (
        <Result
          status="warning"
          title="OAuth 登录失败"
          subTitle="未获取到授权令牌，可能未配置 OAuth 凭据或授权被拒绝。"
          extra={
            <a href="/login" style={{ color: '#1677ff' }}>
              返回登录
            </a>
          }
        />
      )}
    </div>
  );
}
