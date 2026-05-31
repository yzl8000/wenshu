import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Input, Select, Space, Divider, Spin, message, Modal } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, RobotOutlined } from '@ant-design/icons';
import { useResumeStore } from '../../stores/useResumeStore';
import type { ResumeSection } from '../../stores/useResumeStore';
import { useAIStore } from '../../stores/useAIStore';

const { TextArea } = Input;

const SECTION_LABELS: Record<string, string> = {
  personal_info: '个人信息', summary: '个人总结', education: '教育背景',
  experience: '工作经历', skills: '技能特长', projects: '项目经验',
  certifications: '证书资质', languages: '语言能力',
};

const SECTION_ORDER = ['personal_info', 'summary', 'education', 'experience', 'skills', 'projects', 'certifications', 'languages'];

export default function ResumeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentResume, loading, templates, loadResume, fetchTemplates, updateResume, upsertSection, deleteSection } = useResumeStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [activeSection, setActiveSection] = useState('personal_info');

  useEffect(() => {
    if (id) loadResume(id);
    fetchTemplates();
  }, [id, loadResume, fetchTemplates]);

  useEffect(() => {
    if (currentResume) setSelectedTemplateId(currentResume.templateId);
  }, [currentResume]);

  if (loading || !currentResume) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const currentSectionData = currentResume.sections.find((s) => s.sectionType === activeSection);

  const handleSaveSection = async (values: Record<string, unknown>) => {
    try {
      await upsertSection(currentResume.id, currentSectionData?.id || 'new', {
        sectionType: activeSection,
        contentJson: values,
      });
      message.success('已保存');
    } catch {
      message.error('保存失败');
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    await updateResume(currentResume.id, { templateId });
    message.success('模板已切换');
  };

  const handleTitleChange = async (title: string) => {
    await updateResume(currentResume.id, { title });
  };

  const handleExportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) { message.error('请允许弹出窗口'); return; }
    const html = buildResumeHTML(currentResume.sections, currentResume.title);
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); };
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 16 }}>
      {/* Left Panel - Template Selection */}
      <Card style={{ width: 180, flexShrink: 0 }} title="选择模板">
        <Space direction="vertical" style={{ width: '100%' }}>
          {templates.map((t) => (
            <Card
              key={t.id}
              size="small"
              hoverable
              style={{
                border: selectedTemplateId === t.id ? '2px solid #667eea' : undefined,
                textAlign: 'center',
              }}
              onClick={() => handleTemplateChange(t.id)}
            >
              <div style={{ height: 60, background: `linear-gradient(135deg, ${t.configJson ? getTemplateColor(t.configJson) : '#f0f0f0'} 0%, ${t.configJson ? getTemplateColor2(t.configJson) : '#e0e0e0'} 100%)`, borderRadius: 4, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 'bold' }}>
                {t.name}
              </div>
              <span style={{ fontSize: 12 }}>{t.name}</span>
            </Card>
          ))}
        </Space>
      </Card>

      {/* Center - Form Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        <Card size="small">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/app/resumes')}>返回</Button>
            <Input
              defaultValue={currentResume.title}
              style={{ width: 200 }}
              onBlur={(e) => handleTitleChange(e.target.value)}
            />
            <Button type="primary" onClick={handleExportPDF}>导出 PDF</Button>
          </Space>
        </Card>
        <Card
          tabProps={{ size: 'small' }}
          tabList={SECTION_ORDER.map((key) => ({
            key,
            tab: SECTION_LABELS[key],
          }))}
          activeTabKey={activeSection}
          onTabChange={(key) => setActiveSection(key)}
        >
          <SectionForm
            sectionType={activeSection}
            sectionData={currentSectionData || null}
            onSave={handleSaveSection}
            onDelete={
              currentSectionData
                ? () => deleteSection(currentResume.id, currentSectionData.id)
                : undefined
            }
            allSections={currentResume.sections}
          />
        </Card>
      </div>

      {/* Right - Preview */}
      <Card style={{ width: 320, flexShrink: 0 }} title="预览">
        <div style={{ fontSize: 10, transform: 'scale(0.65)', transformOrigin: 'top left', width: '154%' }}>
          <ResumePreview sections={currentResume.sections} />
        </div>
      </Card>
    </div>
  );
}

const FILE_TEXT_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
    <rect x="3" y="3" width="18" height="20" rx="2" />
    <line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

function getTemplateColor(configJson: unknown) {
  try { return JSON.parse(configJson as string).primaryColor || '#2c3e50'; } catch { return '#2c3e50'; }
}
function getTemplateColor2(configJson: unknown) {
  try { return JSON.parse(configJson as string).accentColor || '#2980b9'; } catch { return '#2980b9'; }
}

function buildResumeHTML(sections: ResumeSection[], title: string) {
  const pi = sections.find((s) => s.sectionType === 'personal_info')?.contentJson as Record<string, string> | undefined;
  const summary = sections.find((s) => s.sectionType === 'summary')?.contentJson as Record<string, string> | undefined;
  const education = sections.find((s) => s.sectionType === 'education')?.contentJson as Record<string, unknown[]> | undefined;
  const experience = sections.find((s) => s.sectionType === 'experience')?.contentJson as Record<string, unknown[]> | undefined;
  const skills = sections.find((s) => s.sectionType === 'skills')?.contentJson as Record<string, unknown[]> | undefined;
  const projects = sections.find((s) => s.sectionType === 'projects')?.contentJson as Record<string, unknown[]> | undefined;

  const escape = (s: string) => s?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';

  const expItems = (experience?.['experience'] as Array<Record<string, string>>)?.filter((e) => e.company) || [];
  const eduItems = (education?.['education'] as Array<Record<string, string>>)?.filter((e) => e.school) || [];
  const skillItems = (skills?.['skills'] as Array<Record<string, string>>)?.filter((s) => s.name) || [];
  const projItems = (projects?.['projects'] as Array<Record<string, string>>)?.filter((p) => p.name) || [];

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escape(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 13px; line-height: 1.7; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 50px; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  h3 { font-size: 14px; border-bottom: 2px solid #333; padding-bottom: 4px; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 1px; }
  .contact { font-size: 12px; color: #666; margin-bottom: 16px; }
  .item { margin-bottom: 12px; }
  .item-title { font-weight: bold; font-size: 13px; }
  .item-sub { float: right; font-size: 12px; color: #666; }
  .item-desc { font-size: 12px; margin-top: 4px; color: #555; }
  .skills { font-size: 12px; }
  @media print { body { padding: 30px; } }
</style></head><body>
  ${pi?.name ? `<h1>${escape(pi.name)}</h1>` : '<h1>未命名简历</h1>'}
  ${pi ? `<p class="contact">${[pi.email, pi.phone, pi.location].filter(Boolean).map(escape).join(' | ')}</p>` : ''}
  ${summary?.summary ? `<h3>个人总结</h3><p>${escape(summary.summary)}</p>` : ''}
  ${expItems.length ? `<h3>工作经历</h3>${expItems.map((e) => `<div class="item"><span class="item-title">${escape(e.title || '')}</span><span class="item-sub">${escape(e.company || '')}</span><p class="item-desc">${escape(e.description || '')}</p></div>`).join('')}` : ''}
  ${eduItems.length ? `<h3>教育背景</h3>${eduItems.map((e) => `<div class="item"><span class="item-title">${escape(e.school || '')}</span><span class="item-sub">${escape(e.degree || '')}</span></div>`).join('')}` : ''}
  ${projItems.length ? `<h3>项目经验</h3>${projItems.map((p) => `<div class="item"><span class="item-title">${escape(p.name || '')}</span><p class="item-desc">${escape(p.description || '')}</p></div>`).join('')}` : ''}
  ${skillItems.length ? `<h3>技能特长</h3><p class="skills">${skillItems.map((s) => `${escape(s.name || '')}(${escape(s.level || '')})`).join(' · ')}</p>` : ''}
</body></html>`;
}

// ---- Section Forms ----

function SectionForm({ sectionType, sectionData, onSave, onDelete, allSections }: {
  sectionType: string;
  sectionData: ResumeSection | null;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onDelete?: () => void;
  allSections: ResumeSection[];
}) {
  const [form] = Form.useForm();
  const content = sectionData?.contentJson || {};
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResultText, setAiResultText] = useState('');
  const { loading: aiLoading, generateResumeSection, improveResumeContent } = useAIStore();

  const handleAIGenerate = async () => {
    try {
      const values = form.getFieldsValue();
      const context = { ...values, ...Object.fromEntries(allSections.map((s) => [s.sectionType, s.contentJson])) };
      const result = await generateResumeSection(sectionType, context);
      setAiResultText(result);
      setAiOpen(true);
    } catch {
      message.error('AI 生成失败，请检查 API 配置');
    }
  };

  const handleAIImprove = async () => {
    try {
      const values = form.getFieldsValue();
      const text = typeof values === 'object' ? JSON.stringify(values, null, 2) : String(values);
      if (text === '{}') {
        message.warning('请先填写一些内容再优化');
        return;
      }
      const result = await improveResumeContent(text, SECTION_LABELS[sectionType] || sectionType);
      setAiResultText(result);
      setAiOpen(true);
    } catch {
      message.error('AI 优化失败，请检查 API 配置');
    }
  };

  const renderForm = () => {
    switch (sectionType) {
      case 'personal_info':
        return (
          <>
            <Form.Item name="name" label="姓名" initialValue={(content as Record<string, string>).name}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱" initialValue={(content as Record<string, string>).email}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="电话" initialValue={(content as Record<string, string>).phone}>
              <Input />
            </Form.Item>
            <Form.Item name="location" label="所在地" initialValue={(content as Record<string, string>).location}>
              <Input />
            </Form.Item>
          </>
        );
      case 'summary':
        return (
          <Form.Item name="summary" label="个人总结" initialValue={(content as Record<string, string>).summary}>
            <TextArea rows={5} placeholder="简要介绍您的工作经验、技能和职业目标..." />
          </Form.Item>
        );
      case 'education':
      case 'experience':
      case 'projects':
      case 'certifications':
      case 'languages':
      case 'skills':
        return (
          <Form.List name={sectionType} initialValue={(content as Record<string, unknown[]>)[sectionType] || [{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 12 }} extra={fields.length > 1 && <Button type="text" danger size="small" onClick={() => remove(field.name)}>删除</Button>}>
                    {sectionType === 'skills' ? (
                      <Space>
                        <Form.Item {...field} name={[field.name, 'name']} label="技能" style={{ marginBottom: 0 }}>
                          <Input placeholder="技能名称" />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, 'level']} label="熟练度" style={{ marginBottom: 0 }}>
                          <Select style={{ width: 100 }} options={['入门', '熟练', '精通', '专家'].map((v) => ({ value: v }))} />
                        </Form.Item>
                      </Space>
                    ) : (
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {sectionType === 'education' && (
                          <>
                            <Form.Item {...field} name={[field.name, 'school']} label="学校" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'degree']} label="学位" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                          </>
                        )}
                        {sectionType === 'experience' && (
                          <>
                            <Form.Item {...field} name={[field.name, 'company']} label="公司" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'title']} label="职位" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'description']} label="工作内容" style={{ marginBottom: 8 }}>
                              <TextArea rows={3} />
                            </Form.Item>
                          </>
                        )}
                        {sectionType === 'projects' && (
                          <>
                            <Form.Item {...field} name={[field.name, 'name']} label="项目名称" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'description']} label="项目描述" style={{ marginBottom: 8 }}>
                              <TextArea rows={3} />
                            </Form.Item>
                          </>
                        )}
                        {sectionType === 'certifications' && (
                          <>
                            <Form.Item {...field} name={[field.name, 'name']} label="证书名称" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'issuer']} label="颁发机构" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                          </>
                        )}
                        {sectionType === 'languages' && (
                          <Space>
                            <Form.Item {...field} name={[field.name, 'language']} label="语言" style={{ marginBottom: 8 }}>
                              <Input />
                            </Form.Item>
                            <Form.Item {...field} name={[field.name, 'proficiency']} label="水平" style={{ marginBottom: 8 }}>
                              <Select style={{ width: 100 }} options={['母语', '流利', '良好', '入门'].map((v) => ({ value: v }))} />
                            </Form.Item>
                          </Space>
                        )}
                      </Space>
                    )}
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block>添加</Button>
              </>
            )}
          </Form.List>
        );
      default:
        return <TextArea rows={5} />;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSave}
      key={sectionType} // Re-mount on type change
    >
      {renderForm()}
      <Divider />
      <Space>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存</Button>
        <Button icon={<RobotOutlined />} onClick={handleAIGenerate} loading={aiLoading}>AI 生成</Button>
        <Button icon={<RobotOutlined />} onClick={handleAIImprove} loading={aiLoading}>AI 优化</Button>
        {onDelete && <Button danger onClick={onDelete}>删除此板块</Button>}
      </Space>
      <Modal
        title={`AI ${SECTION_LABELS[sectionType] || ''} - 生成结果`}
        open={aiOpen}
        onCancel={() => setAiOpen(false)}
        onOk={() => {
          try {
            const parsed = JSON.parse(aiResultText);
            form.setFieldsValue(parsed);
          } catch {
            // If not JSON, set as text for summary/single-field sections
            if (sectionType === 'summary') {
              form.setFieldsValue({ summary: aiResultText });
            } else {
              message.info('AI 结果已复制到剪贴板');
              navigator.clipboard.writeText(aiResultText);
            }
          }
          setAiOpen(false);
        }}
        okText="应用结果"
        width={600}
      >
        <div style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto', background: '#fafafa', padding: 16, borderRadius: 8 }}>
          {aiResultText}
        </div>
      </Modal>
    </Form>
  );
}

// ---- Resume Preview ----

function ResumePreview({ sections }: { sections: ResumeSection[] }) {
  const personalInfo = sections.find((s) => s.sectionType === 'personal_info')?.contentJson as Record<string, string> | undefined;
  const summary = sections.find((s) => s.sectionType === 'summary')?.contentJson as Record<string, string> | undefined;
  const education = sections.find((s) => s.sectionType === 'education')?.contentJson as Record<string, unknown[]> | undefined;
  const experience = sections.find((s) => s.sectionType === 'experience')?.contentJson as Record<string, unknown[]> | undefined;
  const skills = sections.find((s) => s.sectionType === 'skills')?.contentJson as Record<string, unknown[]> | undefined;

  return (
    <div style={{ padding: 32, background: '#fff', minHeight: 800, fontFamily: 'sans-serif' }}>
      {/* Name */}
      {personalInfo?.name && (
        <h1 style={{ fontSize: 28, marginBottom: 4 }}>{personalInfo.name}</h1>
      )}
      {/* Contact */}
      {personalInfo && (
        <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ')}
        </p>
      )}
      {/* Summary */}
      {summary?.summary && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ borderBottom: '2px solid #333', paddingBottom: 4, marginBottom: 8, fontSize: 14 }}>个人总结</h3>
          <p style={{ fontSize: 12, lineHeight: 1.8 }}>{summary.summary}</p>
        </div>
      )}
      {/* Experience */}
      {experience && experience['experience'] && (experience['experience'] as Array<Record<string, string>>).length > 0 && (() => {
        const exp = experience['experience'] as Array<Record<string, string>>;
        return (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ borderBottom: '2px solid #333', paddingBottom: 4, marginBottom: 8, fontSize: 14 }}>工作经历</h3>
            {exp.filter((e: Record<string, string>) => e.company).map((item: Record<string, string>, idx: number) => (
              <div key={idx} style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: 13 }}>{item.title}</strong>
                <span style={{ float: 'right', fontSize: 11, color: '#666' }}>{item.company}</span>
                <p style={{ fontSize: 11, marginTop: 4, lineHeight: 1.6 }}>{item.description}</p>
              </div>
            ))}
          </div>
        );
      })()}
      {/* Education */}
      {education && education['education'] && (education['education'] as Array<Record<string, string>>).length > 0 && (() => {
        const edu = education['education'] as Array<Record<string, string>>;
        return (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ borderBottom: '2px solid #333', paddingBottom: 4, marginBottom: 8, fontSize: 14 }}>教育背景</h3>
            {edu.filter((e: Record<string, string>) => e.school).map((item: Record<string, string>, idx: number) => (
              <div key={idx} style={{ marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>{item.school}</strong>
                <span style={{ float: 'right', fontSize: 11 }}>{item.degree}</span>
              </div>
            ))}
          </div>
        );
      })()}
      {/* Skills */}
      {skills && skills['skills'] && (skills['skills'] as Array<Record<string, string>>).length > 0 && (() => {
        const sk = skills['skills'] as Array<Record<string, string>>;
        return (
          <div>
            <h3 style={{ borderBottom: '2px solid #333', paddingBottom: 4, marginBottom: 8, fontSize: 14 }}>技能特长</h3>
            <p style={{ fontSize: 12 }}>
              {sk.filter((s: Record<string, string>) => s.name).map((item: Record<string, string>) => `${item.name}(${item.level})`).join(' · ')}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
