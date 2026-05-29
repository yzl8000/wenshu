import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Tag, theme } from 'antd';
import {
  DashboardOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import AdBanner from '../AdBanner/AdBanner';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/app/dashboard', icon: <DashboardOutlined />, label: '首页' },
  { key: '/app/plagiarism', icon: <FileSearchOutlined />, label: '论文查重' },
  { key: '/app/resumes', icon: <FileTextOutlined />, label: '简历编写' },
  { key: '/app/novels', icon: <BookOutlined />, label: '小说写作' },
  { key: '/app/wallet', icon: <WalletOutlined />, label: '钱包' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/app/profile') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" style={{ borderRight: `1px solid ${themeToken.colorBorderSecondary}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 18 : 20, fontWeight: 'bold' }}>
          {collapsed ? '文' : '文枢'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
        {!collapsed && (
          <div style={{ padding: '8px' }}>
            <AdBanner slot="sidebar" />
          </div>
        )}
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: themeToken.colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${themeToken.colorBorderSecondary}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Tag color="blue" style={{ margin: 0 }}>低至几元</Tag>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Outlet />
          <AdBanner slot="banner" style={{ marginTop: 'auto' }} />
        </Content>
      </Layout>
    </Layout>
  );
}
