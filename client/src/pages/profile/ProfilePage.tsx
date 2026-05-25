import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Divider, Statistic, List, Avatar, Space, Modal, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, ShareAltOutlined, CopyOutlined, TeamOutlined, GiftOutlined, WechatOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
  const { user, referralStats, updateProfile, fetchReferralStats } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  const referralLink = user?.referralCode
    ? `https://wenshu-production.up.railway.app/register?ref=${user.referralCode}`
    : '';

  const handleCopyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      message.success('推荐码已复制');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    message.success('推荐链接已复制');
  };

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
    <div style={{ maxWidth: 700 }}>
      <Title level={3}>个人中心</Title>

      {/* Referral Card */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GiftOutlined style={{ fontSize: 28 }} />
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>邀请好友，获取权益</Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>分享你的推荐码给朋友，一起免费使用文枢</Text>
            </div>
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>我的推荐码</span>} value={user?.referralCode || '-'} valueStyle={{ color: '#fff', fontSize: 20 }} />
            </Col>
            <Col span={8}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.7)' }}>已邀请人数</span>} value={referralStats?.count || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#fff' }} />
            </Col>
            <Col span={8}>
              <Button type="primary" ghost icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)}>
                邀请好友
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Profile Edit Card */}
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

      {/* Password Card */}
      <Card style={{ marginBottom: 24 }}>
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

      {/* Referred Users List */}
      {referralStats && referralStats.users.length > 0 && (
        <Card title={`已邀请用户 (${referralStats.count})`}>
          <List
            dataSource={referralStats.users}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={item.name || '未设置姓名'}
                  description={`加入时间: ${new Date(item.joinedAt).toLocaleDateString('zh-CN')}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Share Modal */}
      <Modal
        title="邀请好友加入文枢"
        open={shareOpen}
        onCancel={() => setShareOpen(false)}
        footer={null}
        width={480}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>推荐码</Text>
            <Input.Search
              value={user?.referralCode || ''}
              enterButton={<CopyOutlined />}
              onSearch={handleCopyCode}
              size="large"
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>推荐链接</Text>
            <Input.Search
              value={referralLink}
              enterButton={<CopyOutlined />}
              onSearch={handleCopyLink}
              size="large"
              style={{ marginTop: 8 }}
            />
          </div>
          <Divider>分享到</Divider>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <Space direction="vertical" align="center">
              <Avatar size={48} icon={<WechatOutlined />} style={{ background: '#07c160' }} />
              <Text style={{ fontSize: 12 }}>微信</Text>
            </Space>
            <Space direction="vertical" align="center">
              <Avatar size={48} icon={<TeamOutlined />} style={{ background: '#667eea' }} />
              <Text style={{ fontSize: 12 }}>朋友圈</Text>
            </Space>
            <Space direction="vertical" align="center">
              <Avatar size={48} icon={<CopyOutlined />} style={{ background: '#fa8c16' }} />
              <Text style={{ fontSize: 12 }}>复制链接</Text>
            </Space>
          </div>
          <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>
            将推荐码或链接分享给朋友，他们注册时填入即可
          </Paragraph>
        </Space>
      </Modal>
    </div>
  );
}
