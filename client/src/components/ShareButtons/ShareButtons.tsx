import { Button, Space, message, Modal, Input, Typography } from 'antd';
import { WechatOutlined, QqOutlined, WeiboOutlined, CopyOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Text } = Typography;

interface ShareButtonsProps {
  title?: string;
  description?: string;
  url?: string;
  showLabel?: boolean;
}

export default function ShareButtons({
  title = '文枢 - AI驱动的免费创作平台',
  description = '论文查重 · 简历编写 · 小说写作，完全免费',
  url = 'https://wenshu-production.up.railway.app',
  showLabel = true,
}: ShareButtonsProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleShareQQ = () => {
    const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(description)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleShareWeibo = () => {
    const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' - ' + description)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${title} - ${url}`).then(() => {
      message.success('已复制，打开微信粘贴发送给好友');
    });
  };

  const handleShareWechat = () => {
    setModalOpen(true);
  };

  const shareText = `${title}\n${description}\n${url}`;

  return (
    <>
      <Space wrap>
        {showLabel && <Text strong style={{ marginRight: 8 }}>分享到：</Text>}
        <Button
          icon={<WechatOutlined />}
          style={{ background: '#07c160', borderColor: '#07c160', color: '#fff' }}
          onClick={handleShareWechat}
        >
          微信{showLabel ? '好友' : ''}
        </Button>
        <Button
          icon={<QqOutlined />}
          style={{ background: '#12b7f5', borderColor: '#12b7f5', color: '#fff' }}
          onClick={handleShareQQ}
        >
          QQ
        </Button>
        <Button
          icon={<WeiboOutlined />}
          style={{ background: '#e6162d', borderColor: '#e6162d', color: '#fff' }}
          onClick={handleShareWeibo}
        >
          微博
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={handleCopyLink}
        >
          复制链接
        </Button>
      </Space>

      <Modal
        title="分享到微信"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            复制下方文案，打开微信粘贴发送
          </Text>
          <Input.TextArea
            value={shareText}
            rows={4}
            readOnly
            onClick={() => {
              navigator.clipboard.writeText(shareText);
              message.success('已复制分享文案');
            }}
            style={{ cursor: 'pointer', textAlign: 'center' }}
          />
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            点击上方文本框自动复制，然后打开微信粘贴即可
          </Text>
        </div>
      </Modal>
    </>
  );
}
