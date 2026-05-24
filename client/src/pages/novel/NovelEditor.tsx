import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Button, Space, Select, Tag, Typography, Empty, Modal, message, Divider } from 'antd';
import {
  BoldOutlined, ItalicOutlined, StrikethroughOutlined,
  OrderedListOutlined, UnorderedListOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  UndoOutlined, RedoOutlined,
  RobotOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useNovelStore } from '../../stores/useNovelStore';
import { useAIStore } from '../../stores/useAIStore';
import { useDebouncedCallback } from 'use-debounce';

const { Text } = Typography;

export default function NovelEditor({ novelId }: { novelId: string }) {
  const { currentChapter, saveStatus, setContent, autoSave, updateChapterStatus } = useNovelStore();

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiResultText, setAiResultText] = useState('');
  const [aiActionLabel, setAiActionLabel] = useState('');
  const { loading: aiLoading, novelContinue, novelExpand, novelCharacter, novelBrainstorm } = useAIStore();

  const debouncedSave = useDebouncedCallback(
    () => { if (novelId && currentChapter) autoSave(novelId, currentChapter.id); },
    2000
  );

  const handleAIContinue = async () => {
    if (!editor) return;
    const text = editor.getText().slice(-1500);
    if (text.trim().length < 50) { message.warning('内容过短，请先写一些内容'); return; }
    try {
      setAiActionLabel('AI 续写');
      const result = await novelContinue(text, '流畅自然');
      setAiResultText(result);
      setAiModalOpen(true);
    } catch { message.error('AI 续写失败'); }
  };

  const handleAIExpand = async () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? editor.getText().slice(-1000) : editor.state.doc.textBetween(from, to);
    if (selectedText.trim().length < 20) { message.warning('请选中要展开的文本'); return; }
    try {
      setAiActionLabel('AI 展开');
      const result = await novelExpand(selectedText, '增加细节描写和环境渲染');
      setAiResultText(result);
      setAiModalOpen(true);
    } catch { message.error('AI 展开失败'); }
  };

  const handleAICharacter = async () => {
    if (!editor) return;
    const text = editor.getText().slice(0, 1000);
    try {
      setAiActionLabel('AI 生成人物');
      const result = await novelCharacter(text);
      setAiResultText(result);
      setAiModalOpen(true);
    } catch { message.error('AI 生成失败'); }
  };

  const handleAIBrainstorm = async () => {
    if (!editor) return;
    const text = editor.getText().slice(0, 1000);
    try {
      setAiActionLabel('AI 头脑风暴');
      const result = await novelBrainstorm(text, '情节发展');
      setAiResultText(result);
      setAiModalOpen(true);
    } catch { message.error('AI 头脑风暴失败'); }
  };

  const handleInsertAIResult = () => {
    if (!editor) return;
    editor.chain().focus().insertContent(aiResultText).run();
    setAiModalOpen(false);
    message.success('已插入');
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '开始书写你的故事...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
    ],
    content: currentChapter?.contentJson,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      // Count CJK characters as "words" too
      const cjkCount = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
      const wordCount = text.split(/\s+/).filter(Boolean).length + cjkCount;
      setContent(json, text, wordCount);
      debouncedSave();
    },
  });

  // Load chapter content when switching chapters
  useEffect(() => {
    if (currentChapter && editor) {
      editor.commands.setContent(currentChapter.contentJson || null);
    }
  }, [currentChapter?.id]);

  if (!editor) return null;

  const saveStatusText = {
    idle: '', saving: '保存中...', saved: '已保存', error: '保存失败',
  }[saveStatus];
  const saveStatusColor = {
    idle: 'default', saving: 'processing', saved: 'green', error: 'red',
  }[saveStatus] as 'default' | 'processing' | 'success' | 'error';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="small" wrap>
          <Button.Group size="small">
            <Button icon={<BoldOutlined />} onClick={() => editor.chain().focus().toggleBold().run()} type={editor.isActive('bold') ? 'primary' : 'default'} />
            <Button icon={<ItalicOutlined />} onClick={() => editor.chain().focus().toggleItalic().run()} type={editor.isActive('italic') ? 'primary' : 'default'} />
            <Button icon={<StrikethroughOutlined />} onClick={() => editor.chain().focus().toggleStrike().run()} type={editor.isActive('strike') ? 'primary' : 'default'} />
          </Button.Group>
          <Button.Group size="small">
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}>H1</Button>
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}>H2</Button>
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}>H3</Button>
          </Button.Group>
          <Button.Group size="small">
            <Button icon={<UnorderedListOutlined />} onClick={() => editor.chain().focus().toggleBulletList().run()} type={editor.isActive('bulletList') ? 'primary' : 'default'} />
            <Button icon={<OrderedListOutlined />} onClick={() => editor.chain().focus().toggleOrderedList().run()} type={editor.isActive('orderedList') ? 'primary' : 'default'} />
          </Button.Group>
          <Button.Group size="small">
            <Button icon={<AlignLeftOutlined />} onClick={() => editor.chain().focus().setTextAlign('left').run()} type={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'} />
            <Button icon={<AlignCenterOutlined />} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
            <Button icon={<AlignRightOutlined />} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
          </Button.Group>
          <Button size="small" icon={<UndoOutlined />} onClick={() => editor.chain().focus().undo().run()} />
          <Button size="small" icon={<RedoOutlined />} onClick={() => editor.chain().focus().redo().run()} />
        </Space>
        <Divider type="vertical" />
        <Space size="small">
          <Button size="small" icon={<ThunderboltOutlined />} onClick={handleAIContinue} loading={aiLoading}>续写</Button>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={handleAIExpand} loading={aiLoading}>展开</Button>
          <Button size="small" icon={<RobotOutlined />} onClick={handleAICharacter} loading={aiLoading}>人物</Button>
          <Button size="small" icon={<RobotOutlined />} onClick={handleAIBrainstorm} loading={aiLoading}>脑暴</Button>
        </Space>
        <Space size="small">
          {saveStatusText && <Tag color={saveStatusColor}>{saveStatusText}</Tag>}
          {currentChapter && (
            <>
              <Text type="secondary" style={{ fontSize: 12 }}>{currentChapter.wordCount} 字</Text>
              <Select
                size="small"
                value={currentChapter.status}
                onChange={(v) => { updateChapterStatus(novelId, currentChapter.id, v); }}
                style={{ width: 80 }}
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'writing', label: '写作中' },
                  { value: 'revising', label: '修改中' },
                  { value: 'complete', label: '已完成' },
                ]}
              />
            </>
          )}
        </Space>
      </div>

      {/* Chapter selector + content */}
      {currentChapter ? (
        <>
          <div style={{ padding: '4px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            <Text strong>{currentChapter.title}</Text>
          </div>
          <div style={{ flex: 1, padding: '24px 48px', overflow: 'auto' }}>
            <EditorContent editor={editor} />
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="选择或创建一个章节开始写作" />
        </div>
      )}
      <Modal
        title={aiActionLabel}
        open={aiModalOpen}
        onCancel={() => setAiModalOpen(false)}
        onOk={handleInsertAIResult}
        okText="插入到编辑器"
        width={640}
      >
        <div style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto', background: '#fafafa', padding: 16, borderRadius: 8, lineHeight: 1.8 }}>
          {aiResultText}
        </div>
      </Modal>
    </div>
  );
}
