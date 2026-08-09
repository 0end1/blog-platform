import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  Select,
  Upload,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  articleApi,
  uploadImage,
  categoryApi,
  tagApi,
  ArticleInput,
} from '@/lib/api';
import { Article, Category, Tag as TagType } from '@blog/shared';
import { PageLayout } from '@/components/layout';
import type { ColumnsType } from 'antd/es/table';

/** 将 ISO 时间转为 <input type="datetime-local"> 所需的本地字符串 */
function formatDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 简化的本地日期时间展示 */
function formatShortDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cover, setCover] = useState<string | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);

  const [form] = Form.useForm();
  const status = Form.useWatch('status', form);

  const fetchList = async (p = page) => {
    setLoading(true);
    try {
      const res = await articleApi.list(p, 10);
      setArticles(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOptions = async () => {
    try {
      const [c, t] = await Promise.all([categoryApi.list(), tagApi.list()]);
      setCategories(c);
      setTags(t);
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setCover(undefined);
    form.resetFields();
    setOpen(true);
    loadOptions();
  };

  const openEdit = (record: Article) => {
    setEditing(record);
    setCover(record.cover);
    form.setFieldsValue({
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      content: record.content,
      status: record.status,
      scheduledPublishAt: record.scheduledPublishAt
        ? formatDateTimeLocal(record.scheduledPublishAt)
        : undefined,
      categoryId: record.category?.id,
      tagIds: record.tags?.map((t) => t.id),
    });
    setOpen(true);
    loadOptions();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    const dto: ArticleInput = { ...values, cover };
    if (dto.status === 'scheduled' && values.scheduledPublishAt) {
      dto.scheduledPublishAt = new Date(values.scheduledPublishAt as string).toISOString();
    } else {
      delete dto.scheduledPublishAt;
    }
    try {
      await articleApi.save(dto, editing?.id);
      message.success(editing ? '更新成功' : '创建成功');
      setOpen(false);
      fetchList(editing ? page : 1);
    } catch (e: unknown) {
      message.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await articleApi.remove(id);
      message.success('删除成功');
      fetchList();
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  };

  const columns: ColumnsType<Article> = [
    { title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string, r: Article) => {
        if (s === 'published') return <Tag color="green">已发布</Tag>;
        if (s === 'scheduled')
          return (
            <Tag color="orange">
              定时 {r.scheduledPublishAt ? formatShortDateTime(r.scheduledPublishAt) : ''}
            </Tag>
          );
        return <Tag>草稿</Tag>;
      },
    },
    { title: '分类', key: 'category', render: (_, r) => r.category?.name ?? '-' },
    { title: '阅读量', dataIndex: 'viewCount', key: 'viewCount' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const uploadButton = (
    <button type="button" style={{ border: 0, background: 'none' }}>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传封面</div>
    </button>
  );

  return (
    <PageLayout title="文章管理">
      <Card
        title="文章列表"
        extra={
          <Button type="primary" onClick={openCreate}>
            新建文章
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={articles}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => {
              setPage(p);
              fetchList(p);
            },
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑文章' : '新建文章'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={680}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'draft' }}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="文章标题" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: '请输入 slug' }]}
          >
            <Input placeholder="url-friendly-slug" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} placeholder="文章摘要" />
          </Form.Item>
          <Form.Item
            name="content"
            label="正文（Markdown）"
            rules={[{ required: true, message: '请输入正文' }]}
          >
            <Input.TextArea rows={8} placeholder="支持 Markdown" />
          </Form.Item>
          <Space size="large">
            <Form.Item name="status" label="状态">
              <Select
                style={{ width: 140 }}
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'scheduled', label: '定时发布' },
                  { value: 'published', label: '发布' },
                ]}
              />
            </Form.Item>
            <Form.Item name="categoryId" label="分类">
              <Select
                style={{ width: 160 }}
                allowClear
                placeholder="选择分类"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          </Space>
          {status === 'scheduled' && (
            <Form.Item
              name="scheduledPublishAt"
              label="发布时间"
              rules={[{ required: true, message: '请选择定时发布时间' }]}
            >
              <Input type="datetime-local" style={{ width: 240 }} />
            </Form.Item>
          )}
          <Form.Item name="tagIds" label="标签">
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              allowClear
              placeholder="选择标签"
              options={tags.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Form.Item>
          <Form.Item label="封面">
            <Upload
              listType="picture-card"
              showUploadList={false}
              accept="image/*"
              maxCount={1}
              customRequest={async (options) => {
                const { file, onSuccess, onError: _onError } = options;
                try {
                  const url = await uploadImage(file as File);
                  setCover(url);
                  onSuccess?.(url);
                  message.success('封面上传成功');
                } catch (err: unknown) {
                  message.error((err as Error).message ?? '上传失败');
                }
              }}
            >
              {cover ? (
                <img src={cover} alt="cover" style={{ width: '100%' }} />
              ) : (
                uploadButton
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  );
}
