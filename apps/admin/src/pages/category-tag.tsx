import { useEffect, useState } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoryApi, tagApi } from '@/lib/api';
import { Category, Tag } from '@blog/shared';

const { Title } = Typography;

type Row = (Category | Tag) & { kind: 'category' | 'tag' };

export function CategoryTag() {
  const [active, setActive] = useState<'category' | 'tag'>('category');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form] = Form.useForm();

  const api = active === 'category' ? categoryApi : tagApi;

  async function load() {
    setLoading(true);
    try {
      const list = await api.list();
      setRows(list.map((r) => ({ ...r, kind: active })));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    form.setFieldsValue({ name: row.name, slug: row.slug });
    setOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.update(editing.id, values);
        message.success('已更新');
      } else {
        await api.create(values.name, values.slug);
        message.success('已创建');
      }
      setOpen(false);
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function handleDelete(row: Row) {
    try {
      await api.remove(row.id);
      message.success('已删除');
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  const columns = [
    { title: '名称', dataIndex: 'name' },
    { title: '别名 (slug)', dataIndex: 'slug' },
    {
      title: '操作',
      render: (_: unknown, row: Row) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(row)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ marginBottom: 0 }}>
          分类与标签
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建
        </Button>
      </div>

      <Tabs
        activeKey={active}
        onChange={(k) => setActive(k as 'category' | 'tag')}
        items={[
          { key: 'category', label: '分类' },
          { key: 'tag', label: '标签' },
        ]}
        style={{ marginTop: 16 }}
      />

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} />

      <Modal
        title={editing ? '编辑' : '新建'}
        open={open}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：技术" />
          </Form.Item>
          <Form.Item
            label="别名 (slug)"
            name="slug"
            rules={[
              { required: true, message: '请输入别名' },
              {
                pattern: /^[a-z0-9-]+$/,
                message: '仅小写字母、数字与连字符',
              },
            ]}
          >
            <Input placeholder="如：tech" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
