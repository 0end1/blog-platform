import { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, message } from 'antd';
import { auditLogApi, AuditLogPage } from '@/lib/api';
import { AuditLog } from '@blog/shared';
import { PageLayout } from '@/components/layout';
import type { ColumnsType } from 'antd/es/table';

const ACTION_OPTIONS = [
  { value: '', label: '全部动作' },
  { value: 'auth.login', label: '登录' },
  { value: 'auth.register', label: '注册' },
  { value: 'oauth.login', label: '第三方登录' },
  { value: 'oauth.unbind', label: '解绑第三方' },
  { value: 'article.create', label: '创建文章' },
  { value: 'article.update', label: '更新文章' },
  { value: 'article.delete', label: '删除文章' },
  { value: 'comment.moderate', label: '审核评论' },
  { value: 'comment.bulkModerate', label: '批量审核' },
  { value: 'sensitive_word.create', label: '新增敏感词' },
  { value: 'sensitive_word.delete', label: '删除敏感词' },
];

export function AuditLogs() {
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const pageSize = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogApi.list({
        limit: pageSize,
        offset: (pageNo - 1) * pageSize,
        action: action || undefined,
      });
      setPage(data);
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo, action]);

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (a: string) => <Tag color="blue">{a}</Tag>,
    },
    {
      title: '结果',
      dataIndex: 'success',
      key: 'success',
      width: 80,
      render: (s: boolean) =>
        s ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>,
    },
    {
      title: '操作人',
      key: 'actor',
      render: (_, r) => (
        <span style={{ color: '#666' }}>{r.actorEmail ?? r.actorId ?? '匿名'}</span>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      width: 130,
      render: (_, r) =>
        r.resource ? `${r.resource}${r.resourceId ? `:${r.resourceId.slice(0, 8)}` : ''}` : '-',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (v?: string | null) => v ?? '-',
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
      render: (v?: string | null) => (v ? <span style={{ color: '#c0392b' }}>{v}</span> : '-'),
    },
  ];

  return (
    <PageLayout title="审计日志">
      <Card
        title="安全审计日志（S4-04）"
        extra={
          <Select
            value={action}
            style={{ width: 160 }}
            onChange={(v) => {
              setAction(v);
              setPageNo(1);
            }}
            options={ACTION_OPTIONS}
          />
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={page?.items ?? []}
          pagination={{
            current: pageNo,
            pageSize,
            total: page?.total ?? 0,
            onChange: (p) => setPageNo(p),
          }}
        />
      </Card>
    </PageLayout>
  );
}
