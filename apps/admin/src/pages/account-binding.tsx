import { useEffect, useState } from 'react';
import { Card, Button, Tag, message, Space } from 'antd';
import { authApi, oauthApi, API_BASE } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { PageLayout } from '@/components/layout';

type ProviderKey = 'github' | 'google';

const PROVIDERS: { key: ProviderKey; label: string; color: string }[] = [
  { key: 'github', label: 'GitHub', color: '#24292f' },
  { key: 'google', label: 'Google', color: '#ea4335' },
];

export function AccountBinding() {
  const token = useAuthStore((s) => s.token);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const me = await authApi.me();
      setSocials(me.socials ?? {});
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
     
  }, []);

  const unbind = async (p: ProviderKey) => {
    try {
      await oauthApi.unbind(p);
      message.success('已解绑');
      load();
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  return (
    <PageLayout title="账号绑定">
      <Card loading={loading}>
        {PROVIDERS.map((p) => {
          const bound = Boolean(socials[p.key]);
          return (
            <div
              key={p.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: p.color,
                  }}
                />
                <span style={{ fontWeight: 500 }}>{p.label}</span>
              </div>
              <Space>
                {bound ? <Tag color="green">已绑定</Tag> : <Tag>未绑定</Tag>}
                {bound ? (
                  <Button danger size="small" onClick={() => unbind(p.key)}>
                    解绑
                  </Button>
                ) : (
                  <Button
                    size="small"
                    type="primary"
                    href={`${API_BASE}/auth/oauth/bind-start/${p.key}?token=${encodeURIComponent(
                      token ?? '',
                    )}`}
                  >
                    绑定
                  </Button>
                )}
              </Space>
            </div>
          );
        })}
        <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          提示：绑定前需先在后端 <code>.env</code> 配置对应 OAuth 凭据，否则按钮会跳转到「未配置」提示页。
        </div>
      </Card>
    </PageLayout>
  );
}
