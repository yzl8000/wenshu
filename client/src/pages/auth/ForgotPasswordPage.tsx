import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0); // 0: enter email, 1: enter code + new password
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', values);
      setEmail(values.email);
      message.info(`验证码: ${data.code}（模拟短信/邮件发送）`);
      setStep(1);
    } catch {
      message.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (values: { code: string; newPassword: string }) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code: values.code, newPassword: values.newPassword });
      message.success('密码已重置，请登录');
      navigate('/login');
    } catch (err: any) {
      message.error(err?.response?.data?.error || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 400, borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>找回密码</Title>
        <Steps current={step} size="small" style={{ marginBottom: 24 }}
          items={[{ title: '验证邮箱' }, { title: '重置密码' }]}
        />

        {step === 0 && (
          <Form onFinish={handleSendCode} layout="vertical">
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入注册邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="注册邮箱" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>获取验证码</Button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login">返回登录</Link>
            </div>
          </Form>
        )}

        {step === 1 && (
          <Form onFinish={handleReset} layout="vertical">
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, textAlign: 'center' }}>
              验证码已发送至 {email}
            </Text>
            <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}>
              <Input prefix={<SafetyOutlined />} placeholder="6位验证码" size="large" maxLength={6} />
            </Form.Item>
            <Form.Item name="newPassword" rules={[{ required: true, min: 6, message: '新密码至少 6 位' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="新密码" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>重置密码</Button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login">返回登录</Link>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}
