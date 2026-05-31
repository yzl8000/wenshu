import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Card, Row, Col, Space, Tag, Divider, Avatar } from 'antd';
import {
  FileSearchOutlined,
  FileTextOutlined,
  BookOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined,
  GithubOutlined,
  WechatOutlined,
  TrophyOutlined,
  StarFilled,
  UserOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  HeartOutlined,
  ShareAltOutlined,
  GiftOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import ShareButtons from '../../components/ShareButtons/ShareButtons';
import PlagiarismDemo from './PlagiarismDemo';

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <FileSearchOutlined style={{ fontSize: 40, color: '#667eea' }} />,
    title: '论文查重',
    desc: '基于 SimHash 算法的智能查重引擎，支持中英文混合检测，联网交叉比对，毫秒级精准定位相似段落，生成专业报告。',
    tag: 'AI 驱动',
    highlights: ['SimHash 指纹算法', '联网交叉比对', '相似度精确报告', '支持 .docx / .pdf / .txt'],
  },
  {
    icon: <FileTextOutlined style={{ fontSize: 40, color: '#f093fb' }} />,
    title: '简历编写',
    desc: '多套专业模板一键切换，智能表单引导填写，AI 辅助优化措辞，一键导出高清 PDF 简历。',
    tag: '模板丰富',
    highlights: ['4套专业模板', '8大内容模块', 'AI 智能优化', 'PDF 高清导出'],
  },
  {
    icon: <BookOutlined style={{ fontSize: 40, color: '#4facfe' }} />,
    title: '小说写作',
    desc: '专业级写作工作台，Tiptap 富文本编辑、章节树管理、人物关系图谱、大纲规划、写作统计、多格式导出。',
    tag: '专业工具',
    highlights: ['富文本编辑器', '人物关系图谱', '写作数据统计', 'EPUB/PDF 导出'],
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

const testimonials = [
  { name: '小王', role: '大四学生', avatar: '王', content: '写毕业论文的时候用文枢查重，几块钱就能查一次，比外面几百块的便宜太多了，还支持联网比对，真的很良心！', rating: 5 },
  { name: '李同学', role: '应届毕业生', avatar: '李', content: '简历模板很专业，AI 优化措辞后，面试邀请明显多了。花十几块钱就能用好久，性价比超高。', rating: 5 },
  { name: '张老师', role: '网文作者', avatar: '张', content: '小说写作功能太强了，人物关系图帮我理清了复杂剧情，写作统计让我保持日更动力。推荐给所有码字的朋友。', rating: 5 },
];

const comparisonData = [
  { feature: '论文查重', wenshu: true, youdao: false, zhiwang: true, paperpass: true },
  { feature: '简历编写', wenshu: true, youdao: true, zhiwang: false, paperpass: false },
  { feature: '小说写作', wenshu: true, youdao: false, zhiwang: false, paperpass: false },
  { feature: 'AI 辅助', wenshu: true, youdao: true, zhiwang: false, paperpass: false },
  { feature: '新用户免费体验', wenshu: true, youdao: false, zhiwang: false, paperpass: false },
  { feature: '数据云端存储', wenshu: true, youdao: true, zhiwang: true, paperpass: true },
  { feature: '多格式导出', wenshu: true, youdao: true, zhiwang: false, paperpass: true },
  { feature: 'API 开放', wenshu: true, youdao: false, zhiwang: false, paperpass: false },
];

const faqItems = [
  { q: '文枢怎么收费？', a: '新用户注册即送 30 积分（可免费查重 3 次）。之后采用积分制，最低 ¥9.90 起即可使用全部功能。查重一次消耗 10 积分，比市面上几百块的查重服务便宜得多。' },
  { q: '积分可以提现吗？', a: '可以！推荐好友获得的积分奖励和充值余额都支持提现到支付宝/微信，最低提现 10 元。' },
  { q: '论文查重准确率如何？', a: '采用 SimHash + 余弦相似度双重算法，准确率可达95%以上，支持联网搜索交叉验证。' },
  { q: '上传的文件安全吗？', a: '您的数据加密存储，不会用于任何其他目的。文件处理后会定期清理。' },
  { q: '支持哪些文件格式？', a: '论文查重支持 .docx、.pdf、.txt 格式上传。小说写作支持导出 PDF、EPUB、DOCX、TXT 四种格式。' },
];

function CountUp({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        counted.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(node);

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <div ref={ref}>
      <span style={{ fontSize: 36, fontWeight: 'bold' }}>{count.toLocaleString()}{suffix}</span>
    </div>
  );
}

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
          <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>注册送 30 积分</Tag>
          {user ? (
            <Button type="primary" onClick={() => navigate('/app/dashboard')}>进入工作台</Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>立即注册</Button>
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
          注册即送 30 积分 · 免费体验
        </Tag>
        <Title level={1} style={{ color: '#fff', fontSize: 48, marginBottom: 16 }}>
          文枢 · AI 驱动的创作平台
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
          论文查重 · 简历编写 · 小说写作，AI 全程辅助，注册即送积分免费体验
        </Paragraph>
        <Space size="middle">
          <Button size="large" onClick={() => navigate('/register')} style={{ fontWeight: 'bold', height: 48, paddingInline: 32 }}>
            立即注册使用
          </Button>
          <Button size="large" ghost onClick={() => navigate('/login')} style={{ height: 48, paddingInline: 32 }}>
            已有账号？登录
          </Button>
        </Space>
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 64 }}>
          {[
            { num: 3, label: '核心功能', suffix: '' },
            { num: 6, label: 'AI 能力', suffix: '+' },
            { num: 30, label: '注册送积分', suffix: '' },
          ].map((s) => (
            <div key={s.label}>
              <CountUp end={s.num} suffix={s.suffix} />
              <div style={{ fontSize: 14, opacity: 0.75 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Section — Try plagiarism check without login */}
      <PlagiarismDemo />

      {/* Ad Space - Top Banner */}
      <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 48px' }}>
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
              <Card hoverable style={{ borderRadius: 12, height: '100%' }} styles={{ body: { padding: 32 } }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    {f.icon}
                    <Tag color="blue" style={{ marginLeft: 12, verticalAlign: 'super' }}>{f.tag}</Tag>
                  </div>
                  <Title level={4} style={{ margin: 0 }}>{f.title}</Title>
                  <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.8 }}>{f.desc}</Paragraph>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {f.highlights.map((h) => (
                      <Tag key={h} style={{ borderRadius: 4 }}>{h}</Tag>
                    ))}
                  </div>
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

      {/* User Testimonials */}
      <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 48px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>用户好评如潮</Title>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
          来自真实用户的使用反馈
        </Paragraph>
        <Row gutter={[24, 24]}>
          {testimonials.map((t) => (
            <Col xs={24} md={8} key={t.name}>
              <Card style={{ borderRadius: 12, background: '#fafbff' }} styles={{ body: { padding: 24 } }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <StarFilled key={i} style={{ color: '#faad14' }} />
                    ))}
                  </div>
                  <Paragraph style={{ fontSize: 14, lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
                    "{t.content}"
                  </Paragraph>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar style={{ background: '#667eea' }}>{t.avatar}</Avatar>
                    <div>
                      <Text strong style={{ fontSize: 14 }}>{t.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{t.role}</Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Ad Space - Mid Banner */}
      <div style={{ maxWidth: 1200, margin: '0 auto 80px', padding: '0 48px' }}>
        <div style={{
          background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: 8,
          padding: 16, textAlign: 'center',
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>广告位 — 468×60 内容广告</Text>
          <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', marginTop: 8, borderRadius: 4 }}>
            <Text type="secondary">Google AdSense / 广告投放</Text>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ background: '#f7f8fc', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>为什么选择文枢？</Title>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
            与市面上其他平台的全面对比
          </Paragraph>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <thead>
                <tr style={{ background: '#667eea', color: '#fff' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14 }}>功能对比</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, background: '#7c6ff7' }}>文枢 🏆</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14 }}>有道云</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14 }}>知网查重</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14 }}>PaperPass</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={row.feature} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbff' }}>
                    <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', background: 'rgba(124,111,247,0.05)' }}>
                      {row.wenshu ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} /> : <CloseCircleFilled style={{ color: '#d9d9d9', fontSize: 18 }} />}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {row.youdao ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} /> : <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {row.zhiwang ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} /> : <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {row.paperpass ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} /> : <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 18 }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              * 数据更新于 2026年5月，以各平台最新公告为准
            </Text>
          </div>
        </div>
      </div>

      {/* Who is this for */}
      <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 48px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>谁在使用文枢？</Title>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
          无论你是学生、职场人还是创作者，文枢都能帮到你
        </Paragraph>
        <Row gutter={[24, 24]}>
          {[
            { icon: '🎓', title: '在校学生', desc: '论文查重、简历准备，从入学到毕业，文枢陪伴你的大学生涯。完全免费，学生党再也不用省吃俭用买查重服务。' },
            { icon: '💼', title: '职场人士', desc: '快速生成专业简历，AI 优化措辞，让你在求职市场中脱颖而出。随时更新随时导出。' },
            { icon: '✍️', title: '内容创作者', desc: '小说作者、自媒体写手的专业工具。人物关系图谱、大纲管理、写作统计，让创作更有章法。' },
            { icon: '🧑‍🏫', title: '教师/研究人员', desc: '快速检查学生论文原创性，AI 辅助文献综述和内容总结，提升科研工作效率。' },
            { icon: '🚀', title: '创业者', desc: '团队招聘用到的 JD 撰写、商业计划书润色，AI 帮你写出专业水准的文档。' },
            { icon: '📚', title: '考研/考公族', desc: '申论素材积累、论文查重降重、学习笔记整理，文枢是备考路上的得力助手。' },
          ].map((item) => (
            <Col xs={24} sm={12} md={8} key={item.title}>
              <Card hoverable style={{ borderRadius: 12, height: '100%', textAlign: 'center' }} styles={{ body: { padding: 24 } }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
                <Title level={5}>{item.title}</Title>
                <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.7 }}>{item.desc}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Pricing */}
      <div style={{ background: '#f7f8fc', padding: '80px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>实惠透明定价</Title>
          <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
            积分制付费，用多少花多少，拒绝高额收费
          </Paragraph>
          <Row gutter={[24, 24]}>
            {[
              { name: '基础版', price: '9.90', credits: 100, desc: '入门体验，适合轻度用户', popular: false },
              { name: '标准版', price: '19.90', credits: 300, desc: '性价比之选，满足日常使用', popular: true },
              { name: '专业版', price: '49.90', credits: 1000, desc: '重度用户首选，量大优惠', popular: false },
            ].map((plan) => (
              <Col xs={24} md={8} key={plan.name}>
                <Card
                  hoverable
                  style={{
                    textAlign: 'center', borderRadius: 12,
                    border: plan.popular ? '2px solid #667eea' : undefined,
                    position: 'relative',
                  }}
                  styles={{ body: { padding: 32 } }}
                >
                  {plan.popular && (
                    <Tag color="purple" style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 14, padding: '2px 16px' }}>
                      最受欢迎
                    </Tag>
                  )}
                  <Title level={4}>{plan.name}</Title>
                  <div style={{ margin: '16px 0' }}>
                    <span style={{ fontSize: 40, fontWeight: 'bold', color: '#667eea' }}>¥{plan.price}</span>
                  </div>
                  <Text>{plan.credits} 积分</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>{plan.desc}</Text>
                  <br />
                  <Button type={plan.popular ? 'primary' : 'default'} style={{ marginTop: 16 }} onClick={() => navigate('/register')}>
                    立即注册
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space wrap>
              <Tag icon={<SafetyOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>积分永久有效</Tag>
              <Tag icon={<SafetyOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>推荐好友赚积分</Tag>
              <Tag icon={<RocketOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>积分可提现</Tag>
              <Tag icon={<HeartOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>持续迭代更新</Tag>
            </Space>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 48px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>常见问题</Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {faqItems.map((item) => (
            <Card key={item.q} style={{ borderRadius: 8 }} styles={{ body: { padding: '16px 24px' } }}>
              <Text strong style={{ fontSize: 15 }}>{item.q}</Text>
              <Divider style={{ margin: '8px 0' }} />
              <Text type="secondary">{item.a}</Text>
            </Card>
          ))}
        </Space>
      </div>

      {/* Share / Referral CTA */}
      <div style={{ background: '#f7f8fc', padding: '60px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <GiftOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <Title level={3}>邀请好友，一起赚积分</Title>
          <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 24 }}>
            每邀请一位好友注册，获得积分奖励。积分可用于平台消费或直接提现到支付宝/微信。
            分享链接给同学和同事，一起创作！
          </Paragraph>
          <Space>
            <Button type="primary" icon={<ShareAltOutlined />} size="large" onClick={() => navigate('/register')}>
              注册即享推荐权益
            </Button>
            <Button icon={<LikeOutlined />} size="large" onClick={() => navigate('/register')}>
              了解更多
            </Button>
          </Space>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        padding: '64px 48px', textAlign: 'center', color: '#fff',
      }}>
        <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>准备好开始了吗？</Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 32 }}>
          注册即送 30 积分，免费体验全部功能 · 好用再付费
        </Paragraph>
        <Space size="middle">
          <Button size="large" onClick={() => navigate('/register')} style={{ fontWeight: 'bold', height: 48, paddingInline: 40, fontSize: 16 }}>
            立即注册，开始创作
          </Button>
          <Button size="large" ghost onClick={() => navigate('/login')} style={{ height: 48, paddingInline: 32 }}>
            已有账号？登录
          </Button>
        </Space>
      </div>

      {/* Footer + Ad */}
      <div style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', padding: '48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 8, padding: 16, marginBottom: 32,
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>广告位 — 970×90 Footer Banner</Text>
            <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', marginTop: 8, borderRadius: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.2)' }}>Google AdSense / 广告投放</Text>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 32, flexWrap: 'wrap' }}>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14 }}>产品</Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>论文查重</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>简历编写</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>小说写作</Text>
              </div>
            </div>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14 }}>关于</Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>关于我们</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>用户协议</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>隐私政策</Text>
              </div>
            </div>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14 }}>联系我们</Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Space>
                  <WechatOutlined />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>微信公众号：文枢创作</Text>
                </Space>
                <Space>
                  <GithubOutlined />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>GitHub</Text>
                </Space>
              </div>
            </div>
          </div>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
          <div style={{ marginBottom: 16 }}>
            <ShareButtons
              title="文枢 - AI驱动的智能创作平台"
              description="论文查重 · 简历编写 · 小说写作，注册即送积分免费体验！"
              url="https://wenshu-production.up.railway.app"
            />
          </div>
          <div style={{ fontSize: 13 }}>
            © 2026 文枢 wenshu.app · 保留一切权利 · 实惠创作平台
          </div>
        </div>
      </div>
    </div>
  );
}
