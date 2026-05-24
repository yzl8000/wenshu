import { useEffect, useState } from 'react';
import { Card, Button, Input, Modal, Space, Typography, Empty, Tree, Tag, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import api from '../../services/api';
import { useNovelStore } from '../../stores/useNovelStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Outline {
  id: string; parentId: string | null; title: string;
  description: string | null; noteContent: string | null;
  linkedChapterId: string | null; sortOrder: number; color: string | null;
}

export default function OutlinePage({ novelId }: { novelId: string }) {
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOutline, setEditingOutline] = useState<Outline | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formColor, setFormColor] = useState('#667eea');
  const [parentId, setParentId] = useState<string | null>(null);
  const chapters = useNovelStore((s) => s.chapters);

  const fetchOutlines = async () => {
    const { data } = await api.get(`/novels/${novelId}/outlines`);
    setOutlines(data.outlines);
  };

  useEffect(() => { fetchOutlines(); }, [novelId]);

  const buildTreeData = (parentId: string | null = null): DataNode[] => {
    return outlines
      .filter((o) => o.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((o) => ({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space size={4}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: o.color || '#999' }} />
              <span>{o.title}</span>
              {o.linkedChapterId && <LinkOutlined style={{ fontSize: 10, color: '#999' }} />}
            </Space>
            <Space size={4}>
              <Button type="text" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); setParentId(o.id); setEditingOutline(null); setFormTitle(''); setFormDesc(''); setFormNote(''); setFormColor('#667eea'); setModalOpen(true); }} />
              <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEdit(o); }} />
              <Popconfirm title="删除？子节点也会被删除" onConfirm={(e) => { e?.stopPropagation(); handleDelete(o.id); }}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            </Space>
          </div>
        ),
        key: o.id,
        children: buildTreeData(o.id),
      }));
  };

  const handleSelect = (keys: React.Key[]) => {
    const id = keys[0] as string;
    const outline = outlines.find((o) => o.id === id);
    setSelectedOutline(outline || null);
  };

  const handleEdit = (outline: Outline) => {
    setEditingOutline(outline);
    setParentId(outline.parentId);
    setFormTitle(outline.title);
    setFormDesc(outline.description || '');
    setFormNote(outline.noteContent || '');
    setFormColor(outline.color || '#667eea');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      message.warning('请输入标题');
      return;
    }
    try {
      if (editingOutline) {
        await api.put(`/novels/${novelId}/outlines/${editingOutline.id}`, {
          title: formTitle, description: formDesc, noteContent: formNote,
          color: formColor, parentId,
        });
      } else {
        await api.post(`/novels/${novelId}/outlines`, {
          title: formTitle, description: formDesc, noteContent: formNote,
          color: formColor, parentId,
        });
      }
      setModalOpen(false);
      message.success('已保存');
      fetchOutlines();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/novels/${novelId}/outlines/${id}`);
    if (selectedOutline?.id === id) setSelectedOutline(null);
    message.success('已删除');
    fetchOutlines();
  };

  const handleLinkChapter = async (chapterId: string) => {
    if (!selectedOutline) return;
    try {
      await api.put(`/novels/${novelId}/outlines/${selectedOutline.id}`, { linkedChapterId: chapterId });
      setSelectedOutline({ ...selectedOutline, linkedChapterId: chapterId });
      message.success('已关联');
      fetchOutlines();
    } catch { message.error('关联失败'); }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 16, borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => {
            setParentId(null); setEditingOutline(null);
            setFormTitle(''); setFormDesc(''); setFormNote(''); setFormColor('#667eea');
            setModalOpen(true);
          }}>添加根节点</Button>
        </div>
        {outlines.length === 0 ? (
          <Empty description="还没有大纲节点" />
        ) : (
          <Tree treeData={buildTreeData()} blockNode showLine onSelect={handleSelect} />
        )}
      </div>

      <div style={{ width: 320, padding: 16, overflow: 'auto' }}>
        {selectedOutline ? (
          <div>
            <Title level={5}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: selectedOutline.color || '#999', marginRight: 8 }} />
              {selectedOutline.title}
            </Title>
            <Text>{selectedOutline.description || '暂无描述'}</Text>
            {selectedOutline.noteContent && (
              <Card size="small" style={{ marginTop: 12 }} title="笔记">
                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedOutline.noteContent}</Text>
              </Card>
            )}
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>关联章节：</Text>
              {selectedOutline.linkedChapterId ? (
                <Tag closable onClose={() => handleLinkChapter('')}>
                  {chapters.find((c) => c.id === selectedOutline.linkedChapterId)?.title || '未知章节'}
                </Tag>
              ) : (
                <Select
                  size="small"
                  placeholder="关联章节（可选）"
                  style={{ width: '100%', marginTop: 4 }}
                  allowClear
                  onChange={(v: string) => handleLinkChapter(v)}
                  options={chapters.map((c) => ({ value: c.id, label: c.title }))}
                />
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <Button size="small" onClick={() => handleEdit(selectedOutline)}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(selectedOutline.id)}>
                <Button size="small" danger style={{ marginLeft: 8 }}>删除</Button>
              </Popconfirm>
            </div>
          </div>
        ) : (
          <Text type="secondary">点击左侧大纲节点查看详情</Text>
        )}
      </div>

      <Modal title={editingOutline ? '编辑大纲' : '添加大纲'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSave} okText="保存">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input placeholder="标题" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          <TextArea rows={2} placeholder="简介" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
          <TextArea rows={3} placeholder="笔记（可选）" value={formNote} onChange={(e) => setFormNote(e.target.value)} />
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>颜色：</Text>
            <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} />
          </Space>
        </Space>
      </Modal>
    </div>
  );
}
