import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Input, Tree, Space, Typography, Spin, Empty, message, Popconfirm } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  ApartmentOutlined, LineChartOutlined, SettingOutlined,
  FileTextOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNovelStore } from '../../stores/useNovelStore';

import NovelEditor from './NovelEditor';
import CharacterGraphPage from './CharacterGraphPage';
import OutlinePage from './OutlinePage';
import StatisticsPage from './StatisticsPage';
import NovelSettingsPage from './NovelSettingsPage';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

type TabKey = 'editor' | 'characters' | 'outlines' | 'statistics' | 'settings';

const TABS: { key: TabKey; icon: React.ReactNode; label: string }[] = [
  { key: 'editor', icon: <EditOutlined />, label: '写作' },
  { key: 'characters', icon: <UserOutlined />, label: '人物' },
  { key: 'outlines', icon: <ApartmentOutlined />, label: '大纲' },
  { key: 'statistics', icon: <LineChartOutlined />, label: '统计' },
  { key: 'settings', icon: <SettingOutlined />, label: '设置' },
];

export default function NovelWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    chapters, currentChapter, loading,
    loadNovelChapters, createChapter, loadChapter, deleteChapter,
  } = useNovelStore();
  const [activeTab, setActiveTab] = useState<TabKey>('editor');
  const [addingChapter, setAddingChapter] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [novelTitle, setNovelTitle] = useState('');

  useEffect(() => {
    if (id) {
      loadNovelChapters(id);
      // Fetch novel title
      import('../../services/api').then((mod) => {
        mod.default.get(`/novels/${id}`).then(({ data }) => setNovelTitle(data.novel?.title || ''));
      });
    }
  }, [id, loadNovelChapters]);

  const handleAddChapter = async () => {
    if (!newTitle.trim() || !id) return;
    try {
      await createChapter(id, newTitle.trim());
      setNewTitle('');
      setAddingChapter(false);
      message.success('章节已添加');
    } catch { message.error('添加失败'); }
  };

  const handleSelectChapter = (chapterId: string) => {
    if (!id) return;
    loadChapter(id, chapterId);
    setActiveTab('editor');
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!id) return;
    await deleteChapter(id, chapterId);
    message.success('已删除');
  };

  // Build tree data from flat chapters
  const rootChapters = chapters.filter((c) => !c.parentId);
  const treeData = rootChapters.map((ch) => ({
    title: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }} onClick={() => handleSelectChapter(ch.id)}>
        <Space size={4}>
          <FileTextOutlined />
          <span style={{ fontSize: 13 }}>{ch.title}</span>
          <Text type="secondary" style={{ fontSize: 10 }}>{ch.wordCount}字</Text>
        </Space>
        <Popconfirm title="删除此章节？" onConfirm={(e) => { e?.stopPropagation(); handleDeleteChapter(ch.id); }} onCancel={(e) => e?.stopPropagation()}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
        </Popconfirm>
      </div>
    ),
    key: ch.id,
    isLeaf: true,
  }));

  const renderContent = () => {
    if (!id) return null;
    switch (activeTab) {
      case 'editor':
        return <NovelEditor novelId={id} />;
      case 'characters':
        return <CharacterGraphPage novelId={id} />;
      case 'outlines':
        return <OutlinePage novelId={id} />;
      case 'statistics':
        return <StatisticsPage novelId={id} />;
      case 'settings':
        return <NovelSettingsPage novelId={id} />;
      default:
        return null;
    }
  };

  return (
    <Layout style={{ height: 'calc(100vh - 120px)', background: 'transparent' }}>
      <Sider width={260} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflow: 'auto', background: '#fafafa' }}>
        <div style={{ padding: '12px 16px' }}>
          <Space style={{ marginBottom: 8 }}>
            <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => navigate('/novels')}>返回</Button>
          </Space>
          <Title level={5} ellipsis style={{ margin: 0 }}>{novelTitle || '加载中...'}</Title>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
          {TABS.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 0', cursor: 'pointer',
                fontSize: 12, color: activeTab === tab.key ? '#667eea' : '#666',
                borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
              }}
            >
              {tab.icon} <span style={{ marginLeft: 4 }}>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Chapter Tree */}
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text strong style={{ fontSize: 12 }}>章节列表</Text>
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setAddingChapter(true)} />
          </div>
          {addingChapter && (
            <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
              <Input size="small" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onPressEnter={handleAddChapter} placeholder="章节名称" autoFocus />
              <Button size="small" type="primary" onClick={handleAddChapter}>确定</Button>
              <Button size="small" onClick={() => { setAddingChapter(false); setNewTitle(''); }}>取消</Button>
            </Space.Compact>
          )}
          {chapters.length > 0 ? (
            <Tree treeData={treeData} blockNode showIcon={false} selectedKeys={currentChapter ? [currentChapter.id] : []} />
          ) : (
            <Empty description="点击 + 添加章节" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </Sider>
      <Content style={{ overflow: 'auto', padding: '0' }}>
        {loading && !currentChapter ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin size="large" />
          </div>
        ) : (
          renderContent()
        )}
      </Content>
    </Layout>
  );
}
