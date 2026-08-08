import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, message } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  UserOutlined,
  AppstoreOutlined,
  TagsOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '@/lib/api';
import { DashboardStats } from '@blog/shared';

const { Title } = Typography;

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .stats()
      .then(setStats)
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const cards = [
    { title: '文章总数', value: stats?.articleCount, icon: <FileTextOutlined /> },
    {
      title: '已发布',
      value: stats?.publishedArticleCount,
      icon: <CheckCircleOutlined />,
    },
    { title: '评论总数', value: stats?.commentCount, icon: <MessageOutlined /> },
    {
      title: '待审评论',
      value: stats?.pendingCommentCount,
      icon: <MessageOutlined />,
    },
    { title: '用户数', value: stats?.userCount, icon: <UserOutlined /> },
    {
      title: '分类数',
      value: stats?.categoryCount,
      icon: <AppstoreOutlined />,
    },
    { title: '标签数', value: stats?.tagCount, icon: <TagsOutlined /> },
    { title: '总阅读量', value: stats?.todayViewCount, icon: <EyeOutlined /> },
  ];

  return (
    <div>
      <Title level={3}>仪表盘</Title>
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={12} sm={8} md={6} key={c.title}>
            <Card>
              <Statistic title={c.title} value={c.value ?? 0} prefix={c.icon} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
