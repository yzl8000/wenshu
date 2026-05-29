import { useState, useEffect } from 'react';
import {
  Card, Typography, Statistic, Table, Tag, Button, Space,
  Row, Col, Modal, Input, message, Tabs, Form, Upload, Image,
} from 'antd';
import {
  DollarOutlined, CheckOutlined, CloseOutlined,
  SettingOutlined, UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import api from '../../services/api';

const { Title, Text } = Typography;

interface Stats {
  revenue: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  totalWithdrawn: number;
}

interface PaymentConfig {
  alipayQr?: string;
  wechatQr?: string;
  alipayAccount?: string;
  wechatAccount?: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [config, setConfig] = useState<PaymentConfig>({});
  const [configModal, setConfigModal] = useState(false);
  const [form] = Form.useForm();

  const fetchAll = async () => {
    try {
      const [s, p, w, c] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/payments'),
        api.get('/admin/withdrawals'),
        api.get('/admin/config'),
      ]);
      setStats(s.data);
      setPayments(p.data);
      setWithdrawals(w.data);
      setConfig(c.data || {});
    } catch { /* not admin */ }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (configModal) form.setFieldsValue(config);
  }, [configModal, config, form]);

  const handleApprovePayment = async (id: string) => {
    await api.post(`/admin/payments/${id}/approve`);
    message.success('已确认到账，积分已发放');
    fetchAll();
  };

  const handleRejectPayment = async (id: string) => {
    await api.post(`/admin/payments/${id}/reject`);
    message.success('已拒绝');
    fetchAll();
  };

  const handleApproveWithdrawal = async (id: string) => {
    await api.post(`/admin/withdrawals/${id}/approve`);
    message.success('已标记打款完成');
    fetchAll();
  };

  const handleRejectWithdrawal = async (id: string) => {
    await api.post(`/admin/withdrawals/${id}/reject`);
    message.success('已拒绝并退回积分');
    fetchAll();
  };

  const handleSaveConfig = async () => {
    try {
      const formValues = form.getFieldsValue();
      const payload = {
        alipayAccount: formValues.alipayAccount || '',
        wechatAccount: formValues.wechatAccount || '',
        alipayQr: config.alipayQr || '',
        wechatQr: config.wechatQr || '',
      };
      await api.put('/admin/config', payload);
      setConfig(payload);
      setConfigModal(false);
      message.success('收款设置已保存');
    } catch { message.error('保存失败'); }
  };

  const refresh = () => fetchAll();

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>管理后台</Title>
        <Tag color="red">管理员</Tag>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="充值收入(积分)" value={stats?.revenue || 0} prefix={<DollarOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待确认充值" value={stats?.pendingPayments || 0} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待处理提现" value={stats?.pendingWithdrawals || 0} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已提现(积分)" value={stats?.totalWithdrawn || 0} /></Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="payments"
        tabBarExtraContent={
          <Space>
            <Button icon={<SettingOutlined />} onClick={() => setConfigModal(true)}>收款设置</Button>
            <Button onClick={refresh}>刷新</Button>
          </Space>
        }
        items={[
          {
            key: 'payments',
            label: `待确认充值 (${payments.length})`,
            children: (
              <Table
                dataSource={payments}
                rowKey="id"
                columns={[
                  { title: '用户', dataIndex: ['user', 'name'], width: 100 },
                  { title: '邮箱', dataIndex: ['user', 'email'], width: 180 },
                  { title: '描述', dataIndex: 'description', ellipsis: true },
                  { title: '金额', dataIndex: 'amount', width: 80, render: (v: number) => `${v} 积分` },
                  {
                    title: '支付方式', dataIndex: 'paymentMethod', width: 80,
                    render: (v: string) => v === 'alipay' ? '支付宝' : v === 'wechat' ? '微信' : v,
                  },
                  {
                    title: '时间', dataIndex: 'createdAt', width: 150,
                    render: (v: string) => new Date(v).toLocaleString('zh-CN'),
                  },
                  {
                    title: '操作', width: 160,
                    render: (_: any, record: any) => (
                      <Space>
                        <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprovePayment(record.id)}>
                          确认到账
                        </Button>
                        <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleRejectPayment(record.id)}>
                          拒绝
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'withdrawals',
            label: `待处理提现 (${withdrawals.length})`,
            children: (
              <Table
                dataSource={withdrawals}
                rowKey="id"
                columns={[
                  { title: '用户', dataIndex: ['user', 'name'], width: 100 },
                  { title: '邮箱', dataIndex: ['user', 'email'], width: 180 },
                  { title: '描述', dataIndex: 'description', ellipsis: true },
                  { title: '金额', dataIndex: 'amount', width: 80, render: (v: number) => `${Math.abs(v)} 积分` },
                  {
                    title: '时间', dataIndex: 'createdAt', width: 150,
                    render: (v: string) => new Date(v).toLocaleString('zh-CN'),
                  },
                  {
                    title: '操作', width: 160,
                    render: (_: any, record: any) => (
                      <Space>
                        <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApproveWithdrawal(record.id)}>
                          已打款
                        </Button>
                        <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleRejectWithdrawal(record.id)}>
                          拒绝
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Config Modal */}
      <Modal
        title="收款方式设置"
        open={configModal}
        onCancel={() => setConfigModal(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical" initialValues={config} form={form}>
          <Form.Item name="alipayAccount" label="支付宝收款账号">
            <Input placeholder="你的支付宝账号（手机号/邮箱）" />
          </Form.Item>
          <Form.Item label="支付宝收款码">
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }: any) => {
                const formData = new FormData();
                formData.append('image', file);
                try {
                  const { data } = await api.post('/upload', formData);
                  setConfig((prev) => ({ ...prev, alipayQr: data.url }));
                  message.success('收款码上传成功');
                  onSuccess?.(data);
                } catch { onError?.({}); message.error('上传失败'); }
              }}
            >
              <Button icon={<UploadOutlined />}>上传支付宝收款码</Button>
            </Upload>
            {config.alipayQr && (
              <div style={{ marginTop: 8 }}>
                <Image src={config.alipayQr} width={120} />
                <Button type="link" danger size="small" onClick={() => setConfig((prev) => ({ ...prev, alipayQr: '' }))}>删除</Button>
              </div>
            )}
          </Form.Item>
          <Form.Item name="wechatAccount" label="微信收款账号">
            <Input placeholder="你的微信号" />
          </Form.Item>
          <Form.Item label="微信收款码">
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }: any) => {
                const formData = new FormData();
                formData.append('image', file);
                try {
                  const { data } = await api.post('/upload', formData);
                  setConfig((prev) => ({ ...prev, wechatQr: data.url }));
                  message.success('收款码上传成功');
                  onSuccess?.(data);
                } catch { onError?.({}); message.error('上传失败'); }
              }}
            >
              <Button icon={<UploadOutlined />}>上传微信收款码</Button>
            </Upload>
            {config.wechatQr && (
              <div style={{ marginTop: 8 }}>
                <Image src={config.wechatQr} width={120} />
                <Button type="link" danger size="small" onClick={() => setConfig((prev) => ({ ...prev, wechatQr: '' }))}>删除</Button>
              </div>
            )}
          </Form.Item>
          <Form.Item>
            <Button type="primary" block onClick={handleSaveConfig}>保存设置</Button>
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          用支付宝/微信截图你的「收款码」，直接上传即可。支持 jpg/png/gif。
        </Text>
      </Modal>
    </div>
  );
}
