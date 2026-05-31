import { useState } from 'react';
import { Card, Button, Input, Typography, Progress, Tag, Space, Collapse } from 'antd';
import { ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const SAMPLE_TEXT = `人工智能技术正在深刻地改变着我们的生活方式。从智能手机到自动驾驶汽车，从医疗诊断到金融分析，AI 的应用已经遍布各行各业。深度学习作为人工智能的核心技术之一，通过模拟人脑神经元的工作方式，让计算机能够从海量数据中学习规律和模式。

深度学习技术的突破性进展，使得计算机视觉、自然语言处理等领域取得了前所未有的成就。例如，在人脸识别领域，深度学习的准确率已经超越了人类的表现。在机器翻译方面，神经网络翻译系统已经能够达到接近专业译员的水平。

人工智能技术正在深刻地改变着我们的生活方式。从智能手机到自动驾驶汽车，AI 正在重塑各个行业的运作模式。深度学习通过模拟人脑神经元结构，让计算机从数据中自主学习特征。`;

interface DemoResult {
  wordCount: number;
  elapsed: number;
  overallSimilarity: number;
  matchedWordCount: number;
  topMatches: Array<{
    sourceText: string;
    targetText: string;
    similarity: number;
  }>;
}

export default function PlagiarismDemo() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDemo = async () => {
    const content = text.trim() || SAMPLE_TEXT;
    if (content.length < 50) { setError('请至少输入 50 个字符'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/demo/plagiarism', { content });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || '检测失败');
    } finally {
      setLoading(false);
    }
  };

  const simColor = (v: number) => {
    if (v > 80) return '#f5222d';
    if (v > 50) return '#fa8c16';
    if (v > 20) return '#faad14';
    return '#52c41a';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>🔍 在线体验论文查重</Title>
        <Paragraph type="secondary" style={{ fontSize: 16 }}>
          粘贴一段文字，立即查看查重效果 — 无需注册
        </Paragraph>
      </div>

      <Card
        style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(102,126,234,0.12)' }}
        bodyStyle={{ padding: 24 }}
      >
        <Input.TextArea
          rows={8}
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); setError(''); }}
          placeholder={SAMPLE_TEXT}
          style={{ fontSize: 14, lineHeight: 1.8 }}
        />
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {text ? `${text.length} 字符` : '试试点击检测，使用预设样文'}
            </Text>
          </Space>
          <Space>
            <Button onClick={() => { setText(SAMPLE_TEXT); setResult(null); }}>填充样文</Button>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              loading={loading}
              onClick={handleDemo}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              开始检测
            </Button>
          </Space>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', borderRadius: 8 }}>
            <Text type="danger">{error}</Text>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 24, animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
              <Card size="small" style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Text type="secondary">总字数</Text>
                <Title level={3} style={{ margin: 0 }}>{result.wordCount}</Title>
              </Card>
              <Card size="small" style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Text type="secondary">重复字数</Text>
                <Title level={3} style={{ margin: 0, color: simColor(result.overallSimilarity) }}>{result.matchedWordCount}</Title>
              </Card>
              <Card size="small" style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Text type="secondary">相似度</Text>
                <Progress
                  type="circle"
                  size={64}
                  percent={Math.round(result.overallSimilarity)}
                  strokeColor={simColor(result.overallSimilarity)}
                  format={(p) => `${p}%`}
                />
              </Card>
              <Card size="small" style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                <Text type="secondary">检测耗时</Text>
                <Title level={3} style={{ margin: 0 }}>{result.elapsed}ms</Title>
              </Card>
            </div>

            {result.topMatches.length > 0 && (
              <Collapse
                items={[{
                  key: 'matches',
                  label: <Text strong>查看重复片段 ({result.topMatches.length} 处)</Text>,
                  children: (
                    <div style={{ maxHeight: 300, overflow: 'auto' }}>
                      {result.topMatches.map((m, i) => (
                        <Card key={i} size="small" style={{ marginBottom: 8 }}>
                          <Tag color={simColor(m.similarity)}>{m.similarity}% 相似</Tag>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <div style={{ flex: 1, padding: 8, background: '#fff1f0', borderRadius: 4, fontSize: 12, lineHeight: 1.6 }}>
                              <Text type="secondary" style={{ fontSize: 10 }}>重复文本</Text>
                              <div>{m.sourceText}...</div>
                            </div>
                            <div style={{ flex: 1, padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12, lineHeight: 1.6 }}>
                              <Text type="secondary" style={{ fontSize: 10 }}>匹配文本</Text>
                              <div>{m.targetText}...</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ),
                }]}
                style={{ marginBottom: 16 }}
              />
            )}

            <div style={{ textAlign: 'center', padding: 16, background: 'linear-gradient(135deg, #f6f8ff 0%, #f0f2ff 100%)', borderRadius: 8 }}>
              <Text strong style={{ fontSize: 15 }}>这只是演示哦！</Text>
              <br />
              <Text type="secondary">注册即可使用完整功能：文件上传、联网交叉比对、详细报告</Text>
              <br />
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/register')}
                style={{ marginTop: 12 }}
              >
                免费注册，送 30 积分
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
