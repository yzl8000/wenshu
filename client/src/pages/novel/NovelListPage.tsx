import { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Typography, Empty, Tag, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Statistic, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNovelStore } from '../../stores/useNovelStore';

const { Title, Text } = Typography;

const GENRES = ['玄幻', '奇幻', '武侠', '仙侠', '都市', '历史', '科幻', '悬疑', '言情', '游戏', '其他'];

export default function NovelListPage() {
  const { novels, fetchNovels, createNovel, deleteNovel } = useNovelStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { fetchNovels(); }, [fetchNovels]);

  const handleCreate = async (values: { title: string; description?: string; genre?: string; targetWords?: number }) => {
    try {
      const id = await createNovel(values);
      setModalOpen(false);
      form.resetFields();
      message.success('小说已创建');
      navigate(`/novels/${id}`);
    } catch { message.error('创建失败'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>我的小说</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>创建新小说</Button>
      </div>

      {novels.length === 0 ? (
        <Empty description="暂无小说，开始你的创作之旅吧" />
      ) : (
        <Row gutter={[16, 16]}>
          {novels.map((novel) => (
            <Col xs={24} sm={12} lg={8} key={novel.id}>
              <Card
                hoverable
                actions={[
                  <EditOutlined key="edit" onClick={() => navigate(`/novels/${novel.id}`)} />,
                  <Popconfirm key="del" title="确定删除？" onConfirm={() => { deleteNovel(novel.id); message.success('已删除'); }}>
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={<BookOutlined style={{ fontSize: 32, color: '#fa8c16' }} />}
                  title={novel.title}
                  description={
                    <div>
                      <Space size={4} style={{ marginBottom: 8 }}>
                        {novel.genre && <Tag color="blue">{novel.genre}</Tag>}
                        <Tag color={novel.status === 'completed' ? 'green' : novel.status === 'writing' ? 'processing' : 'default'}>
                          {novel.status === 'completed' ? '已完结' : novel.status === 'writing' ? '连载中' : '规划中'}
                        </Tag>
                      </Space>
                      <Row gutter={8}>
                        <Col span={8}><Statistic title="字数" value={novel.totalWords || 0} valueStyle={{ fontSize: 14 }} /></Col>
                        <Col span={8}><Statistic title="章节" value={novel._count.chapters} valueStyle={{ fontSize: 14 }} /></Col>
                        <Col span={8}><Statistic title="人物" value={novel._count.characters} valueStyle={{ fontSize: 14 }} /></Col>
                      </Row>
                      <Text type="secondary" style={{ fontSize: 12 }}>{new Date(novel.updatedAt).toLocaleDateString()}</Text>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title="创建新小说" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="创建">
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="小说名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="给你的小说起个名字" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={3} placeholder="简单介绍一下故事背景..." />
          </Form.Item>
          <Form.Item name="genre" label="类型">
            <Select options={GENRES.map((g) => ({ value: g }))} placeholder="选择类型" />
          </Form.Item>
          <Form.Item name="targetWords" label="目标字数">
            <InputNumber min={1000} step={10000} placeholder="预计完成字数" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
