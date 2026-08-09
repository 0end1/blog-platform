import { ReactNode } from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

/** 后台页面内容包装：标题卡片 + 子内容（整体 Layout 由 App 提供） */
export function PageLayout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {title ? (
        <Title level={3} style={{ marginTop: 0 }}>
          {title}
        </Title>
      ) : null}
      {children}
    </div>
  );
}
