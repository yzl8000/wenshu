import { useState, useMemo } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, GiftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = useMemo(() => searchParams.get('ref') || '', [searchParams]);

  const onFinish = async (values: { email: string; password: string; name: string; referralCode?: string }) => {
    setLoading(true);
    try {
      await register(values.email, values.password, values.name, values.referralCode || refCode);
      message.success('注册成功');
      navigate('/app/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '注册失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 420, borderRadius: 12 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>创建账号</Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          开始您的创作之旅
        </Text>
        {refCode && (
          <Alert
            type="success"
            message={`好友邀请你加入文枢！推荐码: ${refCode}`}
            icon={<GiftOutlined />}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="姓名" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="referralCode" initialValue={refCode}>
            <Input prefix={<GiftOutlined />} placeholder="推荐码（选填）" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text>已有账号？</Text> <Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  );
}
