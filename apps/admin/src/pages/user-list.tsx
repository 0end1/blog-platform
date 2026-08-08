import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Select, Popconfirm, message, Typography } from 'antd';
import { userApi } from '@/lib/api';
import { User, Role, UserStatus } from '@blog/shared';

const { Title } = Typography;

const roleOptions = [
  { value: Role.ADMIN, label: '管理员' },
  { value: Role.AUTHOR, label: '作者' },
  { value: Role.READER, label: '读者' },
];

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    userApi
      .list()
      .then(setUsers)
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function changeRole(id: string, role: Role) {
    try {
      await userApi.updateRole(id, role);
      message.success('角色已更新');
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function toggleStatus(user: User) {
    const next: UserStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await userApi.updateStatus(user.id, next);
      message.success(next === 'active' ? '已启用' : '已禁用');
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function remove(user: User) {
    try {
      await userApi.remove(user.id);
      message.success('已删除');
      load();
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: Role, row: User) => (
        <Select
          size="small"
          value={role}
          style={{ width: 100 }}
          options={roleOptions}
          onChange={(v) => changeRole(row.id, v)}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: UserStatus) => (
        <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      render: (_: unknown, row: User) => (
        <Space>
          <Button size="small" onClick={() => toggleStatus(row)}>
            {row.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确认删除该用户？" onConfirm={() => remove(row)}>
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
      <Title level={3}>用户管理</Title>
      <Table<User>
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={columns}
        pagination={false}
      />
    </div>
  );
}
