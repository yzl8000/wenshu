import { useEffect, useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Select, Typography, Divider, Space, message, Empty, List, Popconfirm, Switch } from 'antd';
import { SaveOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useAppStore } from '../../stores/useAppStore';

const { Title, Text } = Typography;

interface Goal {
  id: string; dailyWordTarget: number; startDate: string; endDate: string | null;
  isActive: boolean;
}

export default function NovelSettingsPage({ novelId }: { novelId: string }) {
  const { theme, setTheme } = useAppStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form] = Form.useForm();
  const [goalForm] = Form.useForm();

  const fetchData = async () => {
    const [novelRes, goalsRes] = await Promise.all([
      api.get(`/novels/${novelId}`),
      api.get(`/novels/${novelId}/goals`),
    ]);
    setGoals(goalsRes.data.goals);
    form.setFieldsValue(novelRes.data.novel);
  };

  useEffect(() => { fetchData(); }, [novelId]);

  const handleSaveNovel = async (values: Record<string, unknown>) => {
    try {
      await api.put(`/novels/${novelId}`, values);
      message.success('已更新');
    } catch { message.error('保存失败'); }
  };

  const handleCreateGoal = async (values: { dailyWordTarget: number; startDate: string; endDate?: string }) => {
    try {
      await api.post(`/novels/${novelId}/goals`, values);
      goalForm.resetFields();
      message.success('目标已设置');
      fetchData();
    } catch { message.error('设置失败'); }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await api.delete(`/novels/${novelId}/goals/${goalId}`);
    message.success('已删除');
    fetchData();
  };

  const handleExport = (format: string) => {
    api.get(`/novels/${novelId}/export/${format}`, { responseType: 'blob' }).then(({ data }) => {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `novel.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }).catch(() => message.error('导出功能需配置 Puppeteer'));
  };

  return (
    <div style={{ padding: 24, maxWidth: 700, overflow: 'auto', height: '100%' }}>
      <Title level={4}>小说设置</Title>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSaveNovel}>
          <Form.Item name="title" label="书名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="genre" label="类型">
            <Select options={['玄幻', '奇幻', '武侠', '仙侠', '都市', '历史', '科幻', '悬疑', '言情', '其他'].map((g) => ({ value: g }))} />
          </Form.Item>
          <Form.Item name="targetWords" label="目标字数">
            <InputNumber min={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[
              { value: 'planning', label: '规划中' },
              { value: 'writing', label: '连载中' },
              { value: 'completed', label: '已完结' },
            ]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存修改</Button>
        </Form>
      </Card>

      <Card title="外观设置" style={{ marginBottom: 16 }}>
        <Space>
          <Text>编辑器主题：</Text>
          <Switch
            checked={theme === 'dark'}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
            checkedChildren="暗色"
            unCheckedChildren="亮色"
          />
        </Space>
      </Card>

      <Card title="写作目标" style={{ marginBottom: 16 }}>
        <Form form={goalForm} layout="inline" onFinish={handleCreateGoal} style={{ marginBottom: 16 }}>
          <Form.Item name="dailyWordTarget" label="每日字数目标" rules={[{ required: true }]}>
            <InputNumber min={100} step={500} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">设置目标</Button>
          </Form.Item>
        </Form>
        {goals.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无写作目标" />
        ) : (
          <List
            dataSource={goals}
            renderItem={(goal) => (
              <List.Item
                extra={
                  <Popconfirm title="删除此目标？" onConfirm={() => handleDeleteGoal(goal.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                }
              >
                <List.Item.Meta
                  title={<span>每日 {goal.dailyWordTarget} 字</span>}
                  description={`${new Date(goal.startDate).toLocaleDateString()}${goal.endDate ? ` - ${new Date(goal.endDate).toLocaleDateString()}` : ' 起'} · ${goal.isActive ? '进行中' : '已停用'}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card title="导出">
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('txt')}>导出 TXT</Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('pdf')}>导出 PDF</Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('docx')}>导出 DOCX</Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('epub')}>导出 EPUB</Button>
        </Space>
        <Divider />
        <Text type="secondary">PDF/DOCX/EPUB 导出需要完整配置 Puppeteer 和格式转换库。</Text>
      </Card>
    </div>
  );
}
