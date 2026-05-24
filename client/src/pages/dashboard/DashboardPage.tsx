import { Card, Col, Row, Statistic, Typography } from 'antd';
import { FileSearchOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const features = [
  {
    key: 'plagiarism',
    title: '论文查重',
    icon: <FileSearchOutlined style={{ fontSize: 48, color: '#667eea' }} />,
    description: '基于 SimHash 和余弦相似度算法的智能查重系统，支持文本输入和文件上传，提供详细的相似度报告和高亮对比。',
    path: '/plagiarism',
    stat: '0 次检测',
  },
  {
    key: 'resume',
    title: '简历编写',
    icon: <FileTextOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
    description: '多款专业模板任选，表单化编辑实时预览，一键导出高清 PDF 简历，支持随时保存草稿。',
    path: '/resumes',
    stat: '0 份简历',
  },
  {
    key: 'novel',
    title: '小说写作',
    icon: <BookOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
    description: '完整的写作工作台：富文本编辑器、章节管理、人物关系图谱、大纲规划、写作统计追踪。',
    path: '/novels',
    stat: '0 部小说',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>欢迎使用文枢</Title>
      <Paragraph type="secondary" style={{ marginBottom: 32 }}>
        一站式内容创作工具，涵盖论文查重、简历编写和小说写作三大核心功能。
      </Paragraph>
      <Row gutter={[24, 24]}>
        {features.map((feature) => (
          <Col xs={24} md={8} key={feature.key}>
            <Card
              hoverable
              onClick={() => navigate(feature.path)}
              style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}
            >
              <div style={{ marginBottom: 16 }}>{feature.icon}</div>
              <Title level={4}>{feature.title}</Title>
              <Paragraph type="secondary">{feature.description}</Paragraph>
              <Statistic title="使用统计" value={feature.stat} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
