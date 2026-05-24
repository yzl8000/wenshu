import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, Input, Button, Space, Upload, Tabs, List, Tag, Spin,
  Progress, Collapse, Empty, message, Popconfirm, Divider,
} from 'antd';
import {
  FileTextOutlined, UploadOutlined, DeleteOutlined, HistoryOutlined,
  SearchOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EditOutlined, CompressOutlined, RobotOutlined,
} from '@ant-design/icons';
import { usePlagiarismStore } from '../../stores/usePlagiarismStore';
import type { CheckDetail } from '../../stores/usePlagiarismStore';
import { useAIStore } from '../../stores/useAIStore';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function PlagiarismPage() {
  const {
    checks, currentCheck, loading, polling,
    fetchChecks, createCheck, uploadFile, getCheck, deleteCheck, pollCheck,
  } = usePlagiarismStore();

  const [textInput, setTextInput] = useState('');
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('input');
  const [aiResult, setAiResult] = useState('');
  const { loading: aiLoading, rewrite, summarize } = useAIStore();

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const handleAIRewrite = async () => {
    if (textInput.trim().length < 20) {
      message.warning('文本过短，至少需要20个字符');
      return;
    }
    try {
      const result = await rewrite(textInput);
      setAiResult(result);
      setActiveTab('ai');
      message.success('AI 改写完成');
    } catch {
      message.error('AI 改写失败，请检查 API 配置');
    }
  };

  const handleAISummarize = async () => {
    if (textInput.trim().length < 50) {
      message.warning('文本过短，至少需要50个字符');
      return;
    }
    try {
      const result = await summarize(textInput);
      setAiResult(result);
      setActiveTab('ai');
      message.success('AI 摘要完成');
    } catch {
      message.error('AI 摘要失败，请检查 API 配置');
    }
  };

  const handleTextCheck = async () => {
    if (textInput.trim().length < 50) {
      message.warning('文本内容过短，至少需要50个字符');
      return;
    }
    try {
      const id = await createCheck({ content: textInput, title: title || undefined });
      message.success('已提交检测，正在分析中...');
      await pollCheck(id);
      await getCheck(id);
    } catch {
      message.error('检测失败');
    }
  };

  const handleFileUpload = async (file: UploadFile) => {
    if (!file.originFileObj) return;
    try {
      const id = await uploadFile(file.originFileObj, title || undefined);
      message.success('文件已上传，正在分析中...');
      await pollCheck(id);
      await getCheck(id);
    } catch {
      message.error('文件检测失败');
    }
  };

  const handleSelectCheck = async (id: string) => {
    setActiveTab('result');
    await getCheck(id);
  };

  const handleDeleteCheck = async (id: string) => {
    await deleteCheck(id);
    if (currentCheck?.id === id) {
      setActiveTab('input');
    }
    message.success('已删除');
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 24 }}>
      {/* Left Sidebar - Check History */}
      <Card
        title={<span><HistoryOutlined /> 检测历史</span>}
        style={{ width: 280, flexShrink: 0, overflow: 'auto' }}
        styles={{ body: { padding: 0 } }}
      >
        <List
          loading={loading}
          dataSource={checks}
          locale={{ emptyText: <Empty description="暂无检测记录" /> }}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: currentCheck?.id === item.id ? '#f0f5ff' : undefined,
              }}
              onClick={() => handleSelectCheck(item.id)}
              actions={[
                <Popconfirm key="del" title="确定删除？" onConfirm={(e) => { e?.stopPropagation(); handleDeleteCheck(item.id); }}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Text ellipsis style={{ width: 160 }}>{item.title}</Text>}
                description={
                  <Space size={4}>
                    {item.status === 'processing' && <Tag color="processing" icon={<LoadingOutlined />}>检测中</Tag>}
                    {item.status === 'completed' && <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>}
                    {item.status === 'failed' && <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Right Content Area */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)} items={[
          {
            key: 'input',
            label: <span><SearchOutlined /> 提交检测</span>,
            children: (
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Input
                    placeholder="检测标题（可选）"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ maxWidth: 400 }}
                  />
                  <Tabs
                    items={[
                      {
                        key: 'text',
                        label: <span><FileTextOutlined /> 文本输入</span>,
                        children: (
                          <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <TextArea
                              value={textInput}
                              onChange={(e) => setTextInput(e.target.value)}
                              placeholder="请粘贴需要检测的文本内容（至少50个字符）..."
                              rows={12}
                              showCount
                            />
                            <Button
                              type="primary"
                              size="large"
                              onClick={handleTextCheck}
                              loading={polling}
                              icon={<SearchOutlined />}
                            >
                              开始检测
                            </Button>
                            <Divider />
                            <Space>
                              <Text type="secondary"><RobotOutlined /> AI 助手：</Text>
                              <Button
                                icon={<EditOutlined />}
                                onClick={handleAIRewrite}
                                loading={aiLoading}
                              >
                                AI 改写（降重）
                              </Button>
                              <Button
                                icon={<CompressOutlined />}
                                onClick={handleAISummarize}
                                loading={aiLoading}
                              >
                                AI 摘要
                              </Button>
                            </Space>
                          </Space>
                        ),
                      },
                      {
                        key: 'file',
                        label: <span><UploadOutlined /> 文件上传</span>,
                        children: (
                          <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Upload.Dragger
                              accept=".docx,.pdf,.txt"
                              maxCount={1}
                              customRequest={({ file, onSuccess }) => {
                                handleFileUpload(file as UploadFile);
                                onSuccess?.('ok');
                              }}
                            >
                              <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 48, color: '#667eea' }} /></p>
                              <p>点击或拖拽文件到此区域上传</p>
                              <Text type="secondary">支持 .docx、.pdf、.txt 格式，最大 10MB</Text>
                            </Upload.Dragger>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Space>
              </Card>
            ),
          },
          {
            key: 'result',
            label: <span><CheckCircleOutlined /> 检测结果</span>,
            children: (
              currentCheck ? (
                <CheckResultView check={currentCheck} onRewriteMatch={(text) => { setAiResult(text); setActiveTab('ai'); }} />
              ) : (
                <Empty description="请先提交检测或在左侧选择历史记录" />
              )
            ),
            disabled: !currentCheck,
          },
          {
            key: 'ai',
            label: <span><RobotOutlined /> AI 助手</span>,
            children: (
              <Card>
                {aiResult ? (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Space>
                        <Button size="small" onClick={() => { navigator.clipboard.writeText(aiResult); message.success('已复制'); }}>
                          复制结果
                        </Button>
                        <Button size="small" onClick={() => { setTextInput(aiResult); setActiveTab('input'); }}>
                          用于检测
                        </Button>
                      </Space>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, background: '#fafafa', padding: 16, borderRadius: 8 }}>
                      {aiResult}
                    </div>
                  </div>
                ) : (
                  <Empty description="点击文本输入区的 AI 改写/AI 摘要 按钮来使用 AI 助手" />
                )}
              </Card>
            ),
          },
        ]} />
      </div>
    </div>
  );
}

function MatchCard({ match, onRewrite }: { match: CheckDetail['results'][0]['matches'][0]; onRewrite: (text: string) => void }) {
  const { loading } = useAIStore();
  return (
    <Card key={match.id} size="small" style={{ marginBottom: 12 }}>
      <Space style={{ marginBottom: 8 }}>
        <Tag color="blue">相似度: {Math.round(match.similarity * 100)}%</Tag>
        <Button
          size="small"
          icon={<EditOutlined />}
          loading={loading}
          onClick={() => onRewrite(match.targetText)}
        >
          AI 改写降重
        </Button>
      </Space>
      <Paragraph style={{ marginTop: 8 }}>
        <Text strong>匹配文本：</Text>
        <br />
        <mark style={{ background: '#fff2f0', padding: '2px 4px' }}>
          {match.targetText.slice(0, 200)}
          {match.targetText.length > 200 && '...'}
        </mark>
      </Paragraph>
      <Paragraph>
        <Text strong>来源文本：</Text>
        <br />
        <Text type="secondary">{match.sourceText.slice(0, 200)}{match.sourceText.length > 200 && '...'}</Text>
      </Paragraph>
    </Card>
  );
}

function CheckResultView({ check, onRewriteMatch }: { check: CheckDetail; onRewriteMatch: (text: string) => void }) {
  const { rewrite } = useAIStore();

  const handleMatchRewrite = async (text: string) => {
    try {
      const result = await rewrite(text);
      onRewriteMatch(result);
    } catch {
      message.error('AI 改写失败');
    }
  };
  if (check.status === 'processing') {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24 }}>正在分析中...</Title>
          <Text type="secondary">正在进行 SimHash 指纹提取和相似度比对</Text>
        </div>
      </Card>
    );
  }

  if (check.status === 'failed') {
    return (
      <Card>
        <Empty description="检测失败，请重试" />
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card>
        <Title level={4}>{check.title}</Title>
        <Space split={<Divider type="vertical" />}>
          <Text type="secondary">{check.sourceType === 'file_upload' ? '文件上传' : '文本输入'}</Text>
          {check.fileName && <Text type="secondary">{check.fileName}</Text>}
          <Text type="secondary">{new Date(check.createdAt).toLocaleString()}</Text>
        </Space>
      </Card>

      {check.results.map((result) => (
        <Card key={result.id} title={
          <Space>
            <Tag color={result.sourceType === 'web' ? 'blue' : result.sourceType === 'self' ? 'orange' : 'green'}>
              {result.sourceType === 'web' ? '网络来源' : result.sourceType === 'self' ? '内部重复' : '本地对比'}
            </Tag>
            <Text>{result.sourceLabel}</Text>
          </Space>
        }>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress
                type="circle"
                percent={Math.round(result.overallSimilarity * 100)}
                size={80}
                strokeColor={
                  result.overallSimilarity > 0.5 ? '#ff4d4f' :
                  result.overallSimilarity > 0.2 ? '#faad14' : '#52c41a'
                }
              />
              <div>
                <Text strong>相似度: {Math.round(result.overallSimilarity * 100)}%</Text>
                <br />
                <Text type="secondary">匹配字数: {result.matchedWordCount} / {result.totalWordCount}</Text>
              </div>
            </div>

            {result.matches.length > 0 && (
              <Collapse
                items={[{
                  key: 'matches',
                  label: `查看匹配详情（${result.matches.length} 处匹配）`,
                  children: (
                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                      {result.matches.map((match) => (
                        <MatchCard key={match.id} match={match} onRewrite={handleMatchRewrite} />
                      ))}
                    </div>
                  ),
                }]}
              />
            )}
          </Space>
        </Card>
      ))}

      {check.results.length === 0 && (
        <Empty description="未发现重复内容" />
      )}
    </Space>
  );
}
