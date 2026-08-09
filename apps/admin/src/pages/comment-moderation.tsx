import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  message,
  Input,
  Row,
  Col,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  commentApi,
  sensitiveWordApi,
  SensitiveWord,
} from '@/lib/api';
import { Comment } from '@blog/shared';
import { PageLayout } from '@/components/layout';
import type { ColumnsType } from 'antd/es/table';

type Status = 'pending' | 'approved' | 'rejected';

const STATUS_META: Record<Status, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待审核' },
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已驳回' },
};

export function CommentModeration() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Status | 'all'>('pending');
  const [selected, setSelected] = useState<string[]>([]);

  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [wordInput, setWordInput] = useState('');
  const [wordLoading, setWordLoading] = useState(false);

  const fetchComments = async (f: Status | 'all' = filter) => {
    setLoading(true);
    try {
      const data = await commentApi.list(f === 'all' ? undefined : f);
      setComments(data);
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async () => {
    try {
      setWords(await sensitiveWordApi.list());
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  useEffect(() => {
    fetchComments();
    fetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moderate = async (id: string, status: Status) => {
    try {
      await commentApi.moderate(id, status);
      message.success('已更新');
      fetchComments();
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  const bulk = async (status: Status) => {
    if (selected.length === 0) return message.warning('请先选择评论');
    try {
      await commentApi.bulkModerate(selected, status);
      message.success('批量处理完成');
      setSelected([]);
      fetchComments();
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  const addWord = async () => {
    const w = wordInput.trim();
    if (!w) return;
    setWordLoading(true);
    try {
      await sensitiveWordApi.create(w);
      setWordInput('');
      message.success('已添加');
      fetchWords();
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setWordLoading(false);
    }
  };

  const removeWord = async (id: string) => {
    try {
      await sensitiveWordApi.remove(id);
      message.success('已删除');
      fetchWords();
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  const columns: ColumnsType<Comment> = [
    {
      title: '作者',
      dataIndex: 'authorId',
      key: 'authorId',
      render: (v: string) => <span style={{ color: '#666' }}>{v ? v.slice(0, 8) : '游客'}</span>,
    },
    { title: '内容', dataIndex: 'content', key: 'content' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: Status) => <Tag color={STATUS_META[s].color}>{STATUS_META[s].label}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={r.status === 'approved'}
            onClick={() => moderate(r.id, 'approved')}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            disabled={r.status === 'rejected'}
            onClick={() => moderate(r.id, 'rejected')}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout title="评论审核 · 敏感词">
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            title="评论审核"
            extra={
              <Space>
                <Select
                  value={filter}
                  style={{ width: 130 }}
                  onChange={(v) => {
                    setFilter(v);
                    fetchComments(v);
                  }}
                  options={[
                    { value: 'pending', label: '待审核' },
                    { value: 'approved', label: '已通过' },
                    { value: 'rejected', label: '已驳回' },
                    { value: 'all', label: '全部' },
                  ]}
                />
                <Button onClick={() => bulk('approved')}>批量通过</Button>
                <Button danger onClick={() => bulk('rejected')}>
                  批量驳回
                </Button>
              </Space>
            }
          >
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={comments}
              rowSelection={{
                selectedRowKeys: selected,
                onChange: (keys) => setSelected(keys as string[]),
              }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="敏感词库">
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="新增敏感词"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                onPressEnter={addWord}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={wordLoading}
                onClick={addWord}
              >
                添加
              </Button>
            </Space.Compact>
            <Space size={[8, 8]} wrap>
              {words.length === 0 && <span style={{ color: '#999' }}>暂无敏感词</span>}
              {words.map((w) => (
                <Tag
                  key={w.id}
                  closable
                  color="volcano"
                  closeIcon={<DeleteOutlined />}
                  onClose={() => removeWord(w.id)}
                >
                  {w.word}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </PageLayout>
  );
}
