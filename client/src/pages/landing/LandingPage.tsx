import { useNavigate } from 'react-router-dom';
import { Button, Typography, Card, Row, Col, Space, Tag } from 'antd';
import {
  FileSearchOutlined,
  FileTextOutlined,
  BookOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined,
  GithubOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <FileSearchOutlined style={{ fontSize: 40, color: '#667eea' }} />,
    title: '论文查重',
    desc: '基于 SimHash 算法的智能查重引擎，支持中英文混合检测，联网交叉比对，毫秒级精准定位相似段落。',
    tag: 'AI 驱动',
  },
  {
    icon: <FileTextOutlined style={{ fontSize: 40, color: '#f093fb' }} />,
    title: '简历编写',
    desc: '多套专业模板一键切换，智能表单引导填写，AI 辅助优化措辞，PDF 导出即用。',
    tag: '模板丰富',
  },
  {
    icon: <BookOutlined style={{ fontSize: 40, color: '#4facfe' }} />,
    title: '小说写作',
    desc: '专业级写作工作台，章节树管理、人物关系图谱、大纲规划、写作统计、多格式导出。',
    tag: '专业工具',
  },
];

const aiFeatures = [
  { icon: <ThunderboltOutlined />, label: 'AI 续写', desc: '智能续写，风格一致' },
  { icon: <ThunderboltOutlined />, label: 'AI 展开', desc: '细节描写，丰富内容' },
  { icon: <ThunderboltOutlined />, label: 'AI 润色', desc: '措辞优化，提升表达' },
  { icon: <ThunderboltOutlined />, label: 'AI 改写', desc: '降重改写，保持原意' },
  { icon: <ThunderboltOutlined />, label: 'AI 总结', desc: '提炼要点，快速预览' },
  { icon: <ThunderboltOutlined />, label: 'AI 脑暴', desc: '灵感碰撞，突破瓶颈' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px', borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)', zIndex: 100,
      }}>
        <Text strong style={{ fontSize: 22, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          文枢
        </Text>
        <Space>
          <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>完全免费</Tag>
          {user ? (
            <Button type="primary" onClick={() => navigate('/app/dashboard')}>进入工作台</Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>免费注册</Button>
            </>
          )}
        </Space>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 48px', textAlign: 'center', color: '#fff',
      }}>
        <Tag color="yellow" style={{ fontSize: 14, padding: '4px 16px', marginBottom: 24, fontWeight: 'bold', color: '#333' }}>
          永久免费 · 无需付费
        </Tag>
        <Title level={1} style={{ color: '#fff', fontSize: 48, marginBottom: 16 }}>
          文枢 · AI 驱动的创作平台
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
          论文查重 · 简历编写 · 小说写作，三大工具一站配齐，AI 全程辅助，完全免费使用
        </Paragraph>
        <Space size="middle">
          <Button size="large" onClick={() => navigate('/register')} style={{ fontWeight: 'bold', height: 48, paddingInline: 32 }}>
            立即免费使用
          </Button>
          <Button size="large" ghost onClick={() => navigate('/login')} style={{ height: 48, paddingInline: 32 }}>
            已有账号？登录
          </Button>
        </Space>
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 64 }}>
          {[
            { num: '3', label: '核心功能' },
            { num: '6+', label: 'AI 能力' },
            { num: '0', label: '费用 (元)' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 36, fontWeight: 'bold' }}>{s.num}</div>
              <div style={{ fontSize: 14, opacity: 0.75 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Space - Top Banner */}
      <div style={{
        maxWidth: 1200, margin: '24px auto', padding: '0 48px',
      }}>
        <div style={{
          background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8,
          padding: 16, textAlign: 'center',
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>广告位 — 728×90 Banner</Text>
          <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', marginTop: 8, borderRadius: 4 }}>
            <Text type="secondary">Google AdSense / 广告投放</Text>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 48px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>三大核心功能</Title>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
          AI 深度融入每个环节，让创作事半功倍
        </Paragraph>
        <Row gutter={[32, 32]}>
          {features.map((f) => (
            <Col xs={24} md={8} key={f.title}>
              <Card
                hoverable
                style={{ borderRadius: 12, height: '100%' }}
                styles={{ body: { padding: 32 } }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    {f.icon}
                    <Tag color="blue" style={{ marginLeft: 12, verticalAlign: 'super' }}>{f.tag}</Tag>
                  </div>
                  <Title level={4} style={{ margin: 0 }}>{f.title}</Title>
                  <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.8 }}>{f.desc}</Paragraph>
                  <Button type="link" onClick={() => navigate(user ? `/app${f.title === '论文查重' ? '/plagiarism' : f.title === '简历编写' ? '/resumes' : '/novels'}` : '/register')} style={{ padding: 0 }}>
                    立即体验 →
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* AI Features */}
      <div style={{ background: '#f7f8fc', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>AI 全流程辅助</Title>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
            6 大 AI 能力覆盖论文、简历、小说三大场景
          </Paragraph>
          <Row gutter={[24, 24]}>
            {aiFeatures.map((ai) => (
              <Col xs={12} md={8} key={ai.label}>
                <Card styles={{ body: { padding: 24 } }} style={{ borderRadius: 12 }}>
                  <Space>
                    <span style={{ color: '#667eea' }}>{ai.icon}</span>
                    <div>
                      <Text strong>{ai.label}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 13 }}>{ai.desc}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Why Free */}
      <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 48px', textAlign: 'center' }}>
        <Title level={2}>为什么完全免费？</Title>
        <Paragraph type="secondary" style={{ fontSize: 16, lineHeight: 2 }}>
          我们相信好的创作工具应该对所有人开放。通过广告收入维持服务器成本，
          <br />
          你只需享受创作，不必担心任何费用。
        </Paragraph>
        <Space style={{ marginTop: 16 }}>
          <Tag icon={<SafetyOutlined />} color="green" style={{ fontSize: 14, padding: '4px 12px' }}>无需绑定信用卡</Tag>
          <Tag icon={<SafetyOutlined />} color="green" style={{ fontSize: 14, padding: '4px 12px' }}>无隐藏收费</Tag>
          <Tag icon={<RocketOutlined />} color="green" style={{ fontSize: 14, padding: '4px 12px' }}>持续迭代更新</Tag>
        </Space>
      </div>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        padding: '64px 48px', textAlign: 'center', color: '#fff',
      }}>
        <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>准备好开始了吗？</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 32 }}>
          注册即用，无需等待，完全免费
        </Paragraph>
        <Button size="large" onClick={() => navigate('/register')} style={{ fontWeight: 'bold', height: 48, paddingInline: 40, fontSize: 16 }}>
          免费注册，立即开始
        </Button>
      </div>

      {/* Footer + Ad */}
      <div style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', padding: '48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Ad space in footer */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 8, padding: 16, marginBottom: 32,
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>广告位 — 970×90 Footer Banner</Text>
            <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', marginTop: 8, borderRadius: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.2)' }}>Google AdSense / 广告投放</Text>
            </div>
          </div>

          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>文枢</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto 24px' }}>
            AI 驱动的全能创作平台 · 论文查重 · 简历编写 · 小说写作 · 永久免费
          </Paragraph>
          <Space>
            <Button type="link" icon={<GithubOutlined />} style={{ color: 'rgba(255,255,255,0.5)' }}>GitHub</Button>
            <Button type="link" icon={<WechatOutlined />} style={{ color: 'rgba(255,255,255,0.5)' }}>微信公众号</Button>
          </Space>
          <div style={{ marginTop: 24, fontSize: 13 }}>
            © 2026 文枢 wenshu.app · 保留一切权利
          </div>
        </div>
      </div>
    </div>
  );
}
