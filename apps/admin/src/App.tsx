import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Login } from './pages/login';
import { Dashboard } from './pages/dashboard';
import { ArticleList } from './pages/article-list';
import { CategoryTag } from './pages/category-tag';
import { UserList } from './pages/user-list';
import { useAuthStore } from './store/auth';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/articles', icon: <FileTextOutlined />, label: '文章管理' },
    { key: '/category-tag', icon: <AppstoreOutlined />, label: '分类与标签' },
    { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: 48,
            margin: 16,
            fontWeight: 700,
            color: '#1677ff',
          }}
        >
          博客后台
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/dashboard']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 24,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            管理后台
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#666' }}>{user?.username}</span>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              退出
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/category-tag" element={<CategoryTag />} />
          <Route path="/users" element={<UserList />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
