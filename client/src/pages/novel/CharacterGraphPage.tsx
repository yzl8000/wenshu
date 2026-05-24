import { useEffect, useState } from 'react';
import { Card, Button, Form, Input, Select, Modal, Space, Typography, Empty, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RELATION_LABELS: Record<string, string> = {
  friend: '朋友', enemy: '敌人', family: '家人', lover: '恋人', mentor: '导师', rival: '对手', other: '其他',
};
const ROLE_LABELS: Record<string, string> = {
  protagonist: '主角', antagonist: '反派', supporting: '配角', other: '其他',
};

const COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];

interface Character {
  id: string; name: string; role: string | null; description: string | null;
  attributes: Record<string, unknown> | null; color: string | null;
}

interface Relation {
  id: string; sourceCharacterId: string; targetCharacterId: string;
  relationshipType: string; label: string | null;
  sourceCharacter?: { id: string; name: string };
  targetCharacter?: { id: string; name: string };
}

export default function CharacterGraphPage({ novelId }: { novelId: string }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [relationships, setRelationships] = useState<Relation[]>([]);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [charForm] = Form.useForm();
  const [relForm] = Form.useForm();

  const fetchData = async () => {
    const [charRes, relRes] = await Promise.all([
      api.get(`/novels/${novelId}/characters`),
      api.get(`/novels/${novelId}/relationships`),
    ]);
    setCharacters(charRes.data.characters);
    setRelationships(relRes.data.relationships || []);
  };

  useEffect(() => { fetchData(); }, [novelId]);

  const handleSaveChar = async (values: Record<string, unknown>) => {
    try {
      if (editingChar) {
        await api.put(`/novels/${novelId}/characters/${editingChar.id}`, values);
      } else {
        const colorIdx = characters.length % COLORS.length;
        await api.post(`/novels/${novelId}/characters`, { ...values, color: COLORS[colorIdx] });
      }
      setCharModalOpen(false);
      charForm.resetFields();
      setEditingChar(null);
      message.success('已保存');
      fetchData();
    } catch { message.error('保存失败'); }
  };

  const handleSaveRel = async (values: Record<string, unknown>) => {
    try {
      await api.post(`/novels/${novelId}/relationships`, values);
      setRelModalOpen(false);
      relForm.resetFields();
      message.success('关系已添加');
      fetchData();
    } catch { message.error('添加失败'); }
  };

  const handleDeleteChar = async (charId: string) => {
    await api.delete(`/novels/${novelId}/characters/${charId}`);
    message.success('已删除');
    fetchData();
  };

  const handleDeleteRel = async (relId: string) => {
    await api.delete(`/novels/${novelId}/relationships/${relId}`);
    message.success('已删除');
    fetchData();
  };

  const selectedChar = characters.find((c) => c.id === selectedCharId);

  // ECharts force graph
  const graphOption = {
    tooltip: { formatter: (params: { data?: { name?: string; role?: string } }) => params.data?.name || '' },
    series: [{
      type: 'graph', layout: 'force', roam: true,
      draggable: true,
      force: { repulsion: 200, edgeLength: [100, 300] },
      data: characters.map((c) => ({
        id: c.id, name: c.name, role: c.role,
        symbolSize: 30,
        itemStyle: { color: c.color || '#5470c6' },
        category: c.role || 'other',
      })),
      links: relationships.map((r) => ({
        source: r.sourceCharacterId,
        target: r.targetCharacterId,
        label: { show: true, formatter: r.label || RELATION_LABELS[r.relationshipType] || '', fontSize: 10 },
        lineStyle: { curveness: 0.3 },
      })),
      categories: ['protagonist', 'antagonist', 'supporting', 'other'].map((role) => ({
        name: ROLE_LABELS[role] || role,
      })),
    }],
  };

  const onChartClick = (params: { data?: { id?: string } }) => {
    if (params.data?.id) setSelectedCharId(params.data.id);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setEditingChar(null); charForm.resetFields(); setCharModalOpen(true); }}>添加人物</Button>
          <Button size="small" icon={<LinkOutlined />} onClick={() => { relForm.resetFields(); setRelModalOpen(true); }}>添加关系</Button>
        </div>
        {characters.length === 0 ? (
          <Empty description="还没有人物，添加你的第一个角色吧" style={{ marginTop: 60 }} />
        ) : (
          <ReactECharts option={graphOption} style={{ height: 'calc(100% - 50px)' }} onEvents={{ click: onChartClick }} />
        )}
      </div>

      {/* Detail Panel */}
      <div style={{ width: 280, borderLeft: '1px solid #f0f0f0', padding: 16, overflow: 'auto' }}>
        {selectedChar ? (
          <div>
            <Title level={5}>{selectedChar.name}</Title>
            <Space size={4} style={{ marginBottom: 12 }}>
              {selectedChar.role && <Tag>{ROLE_LABELS[selectedChar.role] || selectedChar.role}</Tag>}
            </Space>
            <Text>{selectedChar.description || '暂无描述'}</Text>
            {selectedChar.attributes && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {JSON.stringify(selectedChar.attributes, null, 2)}
                </Text>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button size="small" onClick={() => { setEditingChar(selectedChar); charForm.setFieldsValue(selectedChar); setCharModalOpen(true); }}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDeleteChar(selectedChar.id)}>
                <Button size="small" danger style={{ marginLeft: 8 }}>删除</Button>
              </Popconfirm>
            </div>
          </div>
        ) : (
          <Text type="secondary">点击图中节点查看人物详情</Text>
        )}

        {/* Relationships list */}
        <div style={{ marginTop: 24 }}>
          <Text strong style={{ fontSize: 13 }}>关系列表</Text>
          {relationships.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关系" />
          ) : (
            relationships.map((rel) => (
              <Card key={rel.id} size="small" style={{ marginTop: 8 }} extra={
                <Popconfirm title="删除此关系？" onConfirm={() => handleDeleteRel(rel.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              }>
                <Text>{rel.sourceCharacter?.name || '?'} → {rel.targetCharacter?.name || '?'}</Text>
                <br />
                <Tag>{RELATION_LABELS[rel.relationshipType] || rel.relationshipType}</Tag>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Character Modal */}
      <Modal title={editingChar ? '编辑人物' : '添加人物'} open={charModalOpen} onCancel={() => { setCharModalOpen(false); setEditingChar(null); }} onOk={() => charForm.submit()}>
        <Form form={charForm} layout="vertical" onFinish={handleSaveChar}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="attributes" label="属性 (JSON)">
            <TextArea rows={3} placeholder='{"age": 25, "gender": "男"}' />
          </Form.Item>
        </Form>
      </Modal>

      {/* Relationship Modal */}
      <Modal title="添加关系" open={relModalOpen} onCancel={() => setRelModalOpen(false)} onOk={() => relForm.submit()}>
        <Form form={relForm} layout="vertical" onFinish={handleSaveRel}>
          <Form.Item name="sourceCharacterId" label="角色A" rules={[{ required: true }]}>
            <Select options={characters.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="targetCharacterId" label="角色B" rules={[{ required: true }]}>
            <Select options={characters.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="relationshipType" label="关系类型">
            <Select options={Object.entries(RELATION_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="label" label="关系描述">
            <Input placeholder="例如：师徒、夫妻" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
