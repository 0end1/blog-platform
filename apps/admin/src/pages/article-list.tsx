import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Spin, message } from 'antd';
import { articleApi, ArticlePage } from '@/lib/api';
import { Article } from '@blog/shared';

const { Title } = Typography;

export function ArticleList() {
  const [data, setData] = useState<ArticlePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    articleApi
      .list(1, 20)
      .then(setData)
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

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (t: string, row: Article) => (
        <a href={`/article/${row.slug}`} target="_blank" rel="noreferrer">
          {t}
        </a>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      render: (_: unknown, row: Article) => row.category?.name ?? '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={s === 'published' ? 'green' : 'default'}>
          {s === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    { title: '阅读量', dataIndex: 'viewCount' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div>
      <Title level={3}>文章管理</Title>
      <Table<Article>
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        pagination={{ total: data?.total, pageSize: 20, showTotal: (t) => `共 ${t} 篇` }}
      />
    </div>
  );
}
