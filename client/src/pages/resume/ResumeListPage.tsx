import { useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Empty, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '../../stores/useResumeStore';

const { Title, Text } = Typography;

export default function ResumeListPage() {
  const { resumes, templates, fetchResumes, fetchTemplates, createResume, deleteResume } = useResumeStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
    fetchTemplates();
  }, [fetchResumes, fetchTemplates]);

  const handleCreate = async () => {
    if (templates.length === 0) {
      message.warning('暂无可用模板');
      return;
    }
    try {
      const id = await createResume(templates[0].id, '未命名简历');
      navigate(`/app/resumes/${id}/edit`);
    } catch {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteResume(id);
    message.success('已删除');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>我的简历</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate}>
          创建新简历
        </Button>
      </div>

      {resumes.length === 0 ? (
        <Empty description="暂无简历，点击上方按钮创建" />
      ) : (
        <Row gutter={[16, 16]}>
          {resumes.map((resume) => (
            <Col xs={24} sm={12} lg={8} key={resume.id}>
              <Card
                hoverable
                actions={[
                  <EditOutlined key="edit" onClick={() => navigate(`/resumes/${resume.id}/edit`)} />,
                  <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(resume.id)}>
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 32, color: '#667eea' }} />}
                  title={resume.title}
                  description={
                    <div>
                      <Tag color="blue">{resume.template.name}</Tag>
                      <Tag color={resume.status === 'complete' ? 'green' : 'default'}>
                        {resume.status === 'complete' ? '已完成' : '草稿'}
                      </Tag>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {resume._count.sections} 个板块 · {new Date(resume.updatedAt).toLocaleDateString()}
                      </Text>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
