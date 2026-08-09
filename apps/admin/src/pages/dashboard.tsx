import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, message, Progress, List, Tag } from 'antd';
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
import { DashboardStats, DateCount } from '@blog/shared';

const { Title } = Typography;

function Trend({ data, color }: { data: DateCount[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      {data.map((d) => (
        <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 88, fontSize: 12, color: '#888' }}>{d.date.slice(5)}</span>
          <Progress
            percent={Math.round((d.count / max) * 100)}
            showInfo={false}
            strokeColor={color}
            style={{ flex: 1 }}
          />
          <span style={{ width: 28, textAlign: 'right', fontSize: 12 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

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

  const s = stats!;
  const cards = [
    { title: '文章总数', value: s.articleCount, icon: <FileTextOutlined /> },
    { title: '已发布', value: s.publishedArticleCount, icon: <CheckCircleOutlined /> },
    { title: '评论总数', value: s.commentCount, icon: <MessageOutlined /> },
    { title: '待审评论', value: s.pendingCommentCount, icon: <MessageOutlined /> },
    { title: '用户数', value: s.userCount, icon: <UserOutlined /> },
    { title: '分类数', value: s.categoryCount, icon: <AppstoreOutlined /> },
    { title: '标签数', value: s.tagCount, icon: <TagsOutlined /> },
    { title: '总阅读量', value: s.totalViewCount, icon: <EyeOutlined /> },
  ];

  const maxCat = Math.max(1, ...(s.categoryDistribution ?? []).map((c) => c.count));

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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="热门文章 Top5">
            <List
              size="small"
              dataSource={s.topArticles ?? []}
              renderItem={(a) => (
                <List.Item>
                  <a href={`/article/${a.slug}`} target="_blank" rel="noreferrer">
                    {a.title}
                  </a>
                  <Tag color="blue">{a.viewCount} 阅读</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="近 14 天文章发布趋势">
            <Trend data={s.articleTrend ?? []} color="#1677ff" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="近 14 天评论趋势">
            <Trend data={s.commentTrend ?? []} color="#52c41a" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="分类文章分布">
            {(s.categoryDistribution ?? []).map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 80, fontSize: 13 }}>{c.name}</span>
                <Progress percent={Math.round((c.count / maxCat) * 100)} showInfo={false} style={{ flex: 1 }} />
                <span style={{ width: 28, textAlign: 'right', fontSize: 13 }}>{c.count}</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
