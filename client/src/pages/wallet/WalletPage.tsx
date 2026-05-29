import { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Statistic, Row, Col, Table, Tag,
  Modal, Input, InputNumber, message, Space, Divider, Form,
  Radio, Image,
} from 'antd';
import {
  WalletOutlined, PlusOutlined, SwapOutlined, GiftOutlined,
  HistoryOutlined, AlipayOutlined, WechatOutlined,
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

interface PaymentConfig {
  alipayQr?: string;
  wechatQr?: string;
  alipayAccount?: string;
  wechatAccount?: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [pricing, setPricing] = useState<{ plans: PricingPlan[], creditCosts: Record<string, number> } | null>(null);
  const [payConfig, setPayConfig] = useState<PaymentConfig>({});
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [payMethod, setPayMethod] = useState<string>('alipay');
  const [proofText, setProofText] = useState('');
  const [step, setStep] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [walletRes, txRes, pricingRes, configRes] = await Promise.all([
        api.get('/wallet/wallet'),
        api.get('/wallet/transactions'),
        api.get('/wallet/pricing'),
        api.get('/wallet/pricing').then(() => api.get('/admin/config').catch(() => ({ data: {} }))),
      ]);
      setWallet(walletRes.data);
      setTxs(txRes.data.list || []);
      setPricing(pricingRes.data);
    } catch { /* ignore */ }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/config');
      setPayConfig(data || {});
    } catch {
      setPayConfig({});
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (rechargeOpen) fetchConfig(); }, [rechargeOpen]);

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setStep(1);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      await api.post('/wallet/recharge', {
        planId: selectedPlan.id,
        paymentMethod: payMethod,
        proof: proofText || undefined,
      });
      message.success('支付申请已提交，等待管理员确认到账');
      setRechargeOpen(false);
      setStep(0);
      setSelectedPlan(null);
      setProofText('');
      fetchData();
    } catch { message.error('提交失败'); }
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
        title={step === 0 ? '选择套餐' : '扫码支付'}
        open={rechargeOpen}
        onCancel={() => { setRechargeOpen(false); setStep(0); setSelectedPlan(null); }}
        footer={null}
        width={650}
      >
        {step === 0 && (
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
                  onClick={() => handleSelectPlan(plan)}
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
        )}

        {step === 1 && selectedPlan && (
          <div>
            <Card size="small" style={{ marginBottom: 16, textAlign: 'center', background: '#f6f8ff' }}>
              <Text>套餐：<Text strong>{selectedPlan.name}</Text></Text>
              <Divider type="vertical" />
              <Text>金额：<Text strong style={{ color: '#f5222d', fontSize: 18 }}>¥{(selectedPlan.price / 100).toFixed(2)}</Text></Text>
              <Divider type="vertical" />
              <Text>获得：<Text strong>{selectedPlan.credits} 积分</Text></Text>
            </Card>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>选择支付方式：</Text>
              <Radio.Group value={payMethod} onChange={(e) => setPayMethod(e.target.value)} buttonStyle="solid" size="large">
                <Radio.Button value="alipay"><AlipayOutlined /> 支付宝</Radio.Button>
                <Radio.Button value="wechat"><WechatOutlined /> 微信</Radio.Button>
              </Radio.Group>
            </div>

            {(payConfig.alipayQr || payConfig.wechatQr || payConfig.alipayAccount || payConfig.wechatAccount) ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                {payMethod === 'alipay' && payConfig.alipayQr && (
                  <div>
                    <Image src={payConfig.alipayQr} alt="支付宝收款码" style={{ maxHeight: 200 }} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
                    {payConfig.alipayAccount && <Text style={{ display: 'block', marginTop: 4 }}>账号：{payConfig.alipayAccount}</Text>}
                  </div>
                )}
                {payMethod === 'wechat' && payConfig.wechatQr && (
                  <div>
                    <Image src={payConfig.wechatQr} alt="微信收款码" style={{ maxHeight: 200 }} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
                    {payConfig.wechatAccount && <Text style={{ display: 'block', marginTop: 4 }}>账号：{payConfig.wechatAccount}</Text>}
                  </div>
                )}
                {payMethod === 'alipay' && !payConfig.alipayQr && payConfig.alipayAccount && (
                  <div style={{ padding: 32, background: '#f0f2f5', borderRadius: 8 }}>
                    <AlipayOutlined style={{ fontSize: 48, color: '#1677ff' }} />
                    <Title level={5} style={{ marginTop: 8 }}>支付宝账号</Title>
                    <Text copyable style={{ fontSize: 18 }}>{payConfig.alipayAccount}</Text>
                  </div>
                )}
                {payMethod === 'wechat' && !payConfig.wechatQr && payConfig.wechatAccount && (
                  <div style={{ padding: 32, background: '#f0f2f5', borderRadius: 8 }}>
                    <WechatOutlined style={{ fontSize: 48, color: '#07c160' }} />
                    <Title level={5} style={{ marginTop: 8 }}>微信账号</Title>
                    <Text copyable style={{ fontSize: 18 }}>{payConfig.wechatAccount}</Text>
                  </div>
                )}
                {((payMethod === 'alipay' && !payConfig.alipayQr && !payConfig.alipayAccount) ||
                  (payMethod === 'wechat' && !payConfig.wechatQr && !payConfig.wechatAccount)) && (
                  <div style={{ padding: 24, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                    <Text type="warning">管理员尚未配置收款方式，请联系管理员</Text>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 24, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', textAlign: 'center' }}>
                <Text type="warning">管理员尚未配置收款码，请联系管理员获取付款方式</Text>
              </div>
            )}

            <Form.Item label="支付凭证（选填）">
              <Input.TextArea
                rows={2}
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="如：已转账，支付宝尾号1234 / 或填写转账单号"
              />
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStep(0)}>返回选择</Button>
              <Button type="primary" onClick={handleSubmitPayment} loading={loading}>
                我已付款，提交确认
              </Button>
            </Space>
          </div>
        )}
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
