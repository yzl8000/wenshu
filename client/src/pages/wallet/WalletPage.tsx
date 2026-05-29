import { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Statistic, Row, Col, Table, Tag,
  Modal, Input, InputNumber, message, Space, Divider, Form, List,
} from 'antd';
import {
  WalletOutlined, PlusOutlined, SwapOutlined, GiftOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

interface WalletData {
  balance: number;
}

interface TxRecord {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  desc: string;
  popular: boolean;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [pricing, setPricing] = useState<{ plans: PricingPlan[], creditCosts: Record<string, number> } | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [walletRes, txRes, pricingRes] = await Promise.all([
        api.get('/wallet/wallet'),
        api.get('/wallet/transactions'),
        api.get('/wallet/pricing'),
      ]);
      setWallet(walletRes.data);
      setTxs(txRes.data.list || []);
      setPricing(pricingRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRecharge = async (planId: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/recharge', { planId });
      setWallet({ balance: data.balance });
      message.success(`充值成功！获得 ${data.charged} 积分`);
      setRechargeOpen(false);
      fetchData();
    } catch { message.error('充值失败'); }
    finally { setLoading(false); }
  };

  const handleWithdraw = async (values: { amount: number; account: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/withdraw', values);
      setWallet({ balance: data.balance });
      message.success('提现申请已提交，待审核');
      setWithdrawOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '提现失败';
      message.error(msg);
    }
    finally { setLoading(false); }
  };

  const txTypeMap: Record<string, { label: string; color: string }> = {
    recharge: { label: '充值', color: 'green' },
    withdrawal: { label: '提现', color: 'orange' },
    consumption: { label: '消费', color: 'blue' },
    referral_bonus: { label: '推荐奖励', color: 'purple' },
  };

  const formatBalance = (cents: number) => `${cents} 积分`;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>我的钱包</Title>
        <Tag color="blue">积分制</Tag>
      </div>

      {/* Balance Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前积分"
              value={wallet?.balance || 0}
              prefix={<WalletOutlined />}
              suffix="积分"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="1元 = 1积分"
              value="1:1"
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="查重一次"
              value={pricing?.creditCosts?.plagiarism || 10}
              prefix="约"
              suffix="积分"
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Space style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setRechargeOpen(true)}>
          购买积分
        </Button>
        <Button icon={<SwapOutlined />} size="large" onClick={() => setWithdrawOpen(true)}>
          积分提现
        </Button>
      </Space>

      {/* Consumption Reference */}
      {pricing && (
        <Card title="积分消耗参考" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            {Object.entries(pricing.creditCosts).map(([key, cost]) => (
              <Col span={8} key={key}>
                <Text type="secondary">{key}: </Text>
                <Text strong>{cost} 积分/次</Text>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Recharge Modal */}
      <Modal
        title="购买积分"
        open={rechargeOpen}
        onCancel={() => setRechargeOpen(false)}
        footer={null}
        width={600}
      >
        <Row gutter={[16, 16]}>
          {pricing?.plans.map((plan) => (
            <Col span={8} key={plan.id}>
              <Card
                hoverable
                style={{
                  textAlign: 'center',
                  border: plan.popular ? '2px solid #667eea' : undefined,
                  position: 'relative',
                }}
                onClick={() => handleRecharge(plan.id)}
              >
                {plan.popular && (
                  <Tag color="purple" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                    推荐
                  </Tag>
                )}
                <Title level={5}>{plan.name}</Title>
                <Title level={3} style={{ color: '#667eea' }}>
                  ¥{(plan.price / 100).toFixed(2)}
                </Title>
                <Text type="secondary">{plan.credits} 积分</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{plan.desc}</Text>
              </Card>
            </Col>
          ))}
        </Row>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Tag color="orange">模拟支付</Tag>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            当前为演示模式，点击即可完成充值
          </Text>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        title="积分提现"
        open={withdrawOpen}
        onCancel={() => setWithdrawOpen(false)}
        footer={null}
        width={400}
      >
        <Form layout="vertical" onFinish={handleWithdraw}>
          <Form.Item label="当前积分">
            <Input value={formatBalance(wallet?.balance || 0)} disabled />
          </Form.Item>
          <Form.Item
            name="amount"
            label="提现积分"
            rules={[
              { required: true, message: '请输入提现积分' },
              { type: 'number', min: 1000, message: '最低提现1000积分(10元)' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="最低1000积分" min={1000} step={100} />
          </Form.Item>
          <Form.Item
            name="account"
            label="收款账号"
            rules={[{ required: true, message: '请填写支付宝/微信收款账号' }]}
          >
            <Input placeholder="支付宝账号或微信号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>提交提现申请</Button>
          </Form.Item>
        </Form>
        <Divider />
        <Text type="secondary" style={{ fontSize: 12 }}>
          提现说明：100积分 = 1元。提交后1-3个工作日审核到账。最低提现1000积分(10元)。
        </Text>
      </Modal>

      {/* Transaction History */}
      <Card title={<><HistoryOutlined /> 交易记录</>}>
        <Table
          dataSource={txs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: '类型', dataIndex: 'type', width: 100,
              render: (v: string) => {
                const t = txTypeMap[v] || { label: v, color: 'default' };
                return <Tag color={t.color}>{t.label}</Tag>;
              },
            },
            {
              title: '金额', dataIndex: 'amount', width: 100,
              render: (v: number) => (
                <Text style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                  {v >= 0 ? '+' : ''}{v} 积分
                </Text>
              ),
            },
            { title: '描述', dataIndex: 'description', ellipsis: true },
            { title: '余额', dataIndex: 'balance', width: 100, render: (v: number) => `${v} 积分` },
            {
              title: '状态', dataIndex: 'status', width: 80,
              render: (v: string) => {
                const m: Record<string, { label: string; color: string }> = {
                  completed: { label: '完成', color: 'green' },
                  pending: { label: '审核中', color: 'orange' },
                  rejected: { label: '已拒绝', color: 'red' },
                };
                const t = m[v] || { label: v, color: 'default' };
                return <Tag color={t.color}>{t.label}</Tag>;
              },
            },
            {
              title: '时间', dataIndex: 'createdAt', width: 160,
              render: (v: string) => new Date(v).toLocaleString('zh-CN'),
            },
          ]}
        />
      </Card>
    </div>
  );
}
