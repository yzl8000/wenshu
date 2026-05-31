import { Typography } from 'antd';

const { Text } = Typography;

interface AdBannerProps {
  slot?: string;
  style?: React.CSSProperties;
  content?: string; // Ad image URL or HTML — hides banner when empty
}

const slotSizes: Record<string, { width: number; height: number; label: string }> = {
  sidebar: { width: 160, height: 600, label: '160×600 侧边栏广告' },
  banner: { width: 728, height: 90, label: '728×90 横幅广告' },
  'in-content': { width: 468, height: 60, label: '468×60 内容广告' },
  footer: { width: 970, height: 90, label: '970×90 底部广告' },
  rectangle: { width: 300, height: 250, label: '300×250 矩形广告' },
};

export default function AdBanner({ slot = 'banner', style, content }: AdBannerProps) {
  // Hide banner when no ad content is configured
  if (!content) return null;

  const info = slotSizes[slot] || slotSizes.banner;

  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px dashed #d9d9d9',
        borderRadius: 6,
        padding: 8,
        textAlign: 'center',
        ...style,
      }}
    >
      <Text type="secondary" style={{ fontSize: 11, userSelect: 'none' }}>
        {info.label}
      </Text>
      <div
        style={{
          height: info.height,
          width: '100%',
          maxWidth: info.width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f0f0',
          marginTop: 4,
          borderRadius: 4,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <img src={content} alt="广告" style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    </div>
  );
}
