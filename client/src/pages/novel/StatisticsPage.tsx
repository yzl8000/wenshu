import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Empty, Spin } from 'antd';
import { FireOutlined, EditOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../services/api';

const { Title } = Typography;

interface StatsData {
  totalWords: number;
  chapterCount: number;
  characterCount: number;
  dailyProgress: { date: string; wordCount: number }[];
  writingStreak: { currentStreak: number; longestStreak: number };
}

export default function StatisticsPage({ novelId }: { novelId: string }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/novels/${novelId}/statistics`).then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [novelId]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!stats) return <Empty description="暂无统计数据" />;

  const lineOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stats.dailyProgress.map((d) => d.date), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value', name: '字数' },
    series: [{
      data: stats.dailyProgress.map((d) => d.wordCount),
      type: 'line', smooth: true, areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#667eea' },
    }],
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <Title level={4}>写作统计</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="总字数" value={stats.totalWords} prefix={<EditOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="章节数" value={stats.chapterCount} prefix={<BookOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="人物数" value={stats.characterCount} prefix={<FireOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="连续写作天数"
              value={stats.writingStreak.currentStreak}
              suffix={`/ ${stats.writingStreak.longestStreak} 天最佳`}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="每日写作趋势（近30天）" style={{ marginBottom: 24 }}>
        {stats.dailyProgress.length > 0 ? (
          <ReactECharts option={lineOption} style={{ height: 300 }} />
        ) : (
          <Empty description="暂无数据，开始写作吧" />
        )}
      </Card>
    </div>
  );
}
