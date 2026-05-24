import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title } = Typography;

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinishProfile = async (values: { name: string }) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('个人信息已更新');
    } catch {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinishPassword = async (values: { currentPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('密码已修改，请重新登录');
    } catch {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={3}>个人中心</Title>
      <Card style={{ marginBottom: 24 }}>
        <Form layout="vertical" initialValues={{ name: user?.name }} onFinish={onFinishProfile}>
          <Form.Item label="邮箱">
            <Input value={user?.email} disabled />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>保存修改</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card>
        <Title level={5}>修改密码</Title>
        <Divider />
        <Form layout="vertical" onFinish={onFinishPassword}>
          <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>修改密码</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
