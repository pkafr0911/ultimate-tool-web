import { handleCopy as helperCopy } from '@/helpers';
import {
  FireOutlined,
  FontSizeOutlined,
  GiftOutlined,
  HeartOutlined,
  PictureOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Input, message, Row, Tabs, Tag, Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid } from 'react-window';
import { EmojiEntry, loadEmojiData } from './fetchUnicodeEmoji';
import './styles.less';

const { Search } = Input;

const categoryIconMap: Record<string, React.ReactNode> = {
  Smileys: <SmileOutlined />,
  People: <SmileOutlined />,
  Animals: <PictureOutlined />,
  Food: <GiftOutlined />,
  Activities: <FireOutlined />,
  Travel: <PictureOutlined />,
  Objects: <PictureOutlined />,
  Symbols: <HeartOutlined />,
  Flags: <PictureOutlined />,
  Aesthetic: <PictureOutlined />,
  Kaomoji: <FontSizeOutlined />,
};

const safeCopy = async (text: string) => {
  try {
    helperCopy(text);
  } catch {
    message.error('Copy failed');
  }
};

const EmojisPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [emojiData, setEmojiData] = useState<Record<string, EmojiEntry[]>>({});
  const [kaomojiData, setKaomojiData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { emojis, kaomoji } = await loadEmojiData();
      setEmojiData(emojis);
      setKaomojiData(kaomoji);
      setLoading(false);
    })();
  }, []);

  // 🔍 Filter Emojis by search query
  const filteredEmojis = useMemo(() => {
    if (!query.trim()) return emojiData;
    const q = query.toLowerCase();
    const out: Record<string, EmojiEntry[]> = {};
    for (const [k, arr] of Object.entries(emojiData)) {
      const f = arr.filter((e) => e.name.toLowerCase().includes(q) || e.emoji.includes(q));
      if (f.length) out[k] = f;
    }
    return out;
  }, [query, emojiData]);

  // 🧮 Count totals
  const totalEmojis = Object.values(filteredEmojis).reduce((sum, arr) => sum + arr.length, 0);
  const totalKaomoji = Object.values(kaomojiData).reduce((sum, arr) => sum + arr.length, 0);

  if (loading)
    return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading emoji dataset…</div>;

  const renderCategory = (category: string, items: EmojiEntry[]) => (
    <div key={category} className="category-block">
      <div className="category-header">
        <span className="category-icon">{categoryIconMap[category]}</span>
        <span className="category-title">{category}</span>
        <Tag color="blue" style={{ marginLeft: 8 }}>
          {items.length}
        </Tag>
      </div>

      <div style={{ height: 200 }}>
        <AutoSizer>
          {({ height, width }) => {
            const columnCount = Math.floor(width / 60);
            const rowCount = Math.ceil(items.length / columnCount);
            return (
              <FixedSizeGrid
                columnCount={columnCount}
                columnWidth={60}
                height={height}
                rowCount={rowCount}
                rowHeight={60}
                width={width}
              >
                {({ columnIndex, rowIndex, style }) => {
                  const index = rowIndex * columnCount + columnIndex;
                  const item = items[index];
                  if (!item) return null;
                  return (
                    <div style={style} className="emoji-cell">
                      <Tooltip title={`${item.name} (Click to copy)`}>
                        <Button className="emoji-btn" onClick={() => safeCopy(item.emoji)}>
                          {item.emoji}
                        </Button>
                      </Tooltip>
                    </div>
                  );
                }}
              </FixedSizeGrid>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );

  return (
    <div className="emoji-page-container">
      <Card title="✨ Emoji & Kaomoji Picker" variant={'borderless'} className="emoji-card-root">
        <div className="controls">
          <Search
            placeholder="Search emoji or kaomoji..."
            allowClear
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 520 }}
          />
        </div>

        <Tabs
          defaultActiveKey="emoji"
          items={[
            {
              key: 'emoji',
              label: (
                <span>
                  <SmileOutlined /> Emoji <Tag color="blue">{totalEmojis}</Tag>
                </span>
              ),
              children: (
                <div className="tab-content">
                  {Object.entries(filteredEmojis).map(([cat, items]) => renderCategory(cat, items))}
                </div>
              ),
            },
            {
              key: 'kaomoji',
              label: (
                <span>
                  <FontSizeOutlined /> Kaomoji <Tag color="purple">{totalKaomoji}</Tag>
                </span>
              ),
              children: (
                <div className="tab-content">
                  {Object.entries(kaomojiData).map(([k, v]) => (
                    <Row gutter={[8, 8]} key={k}>
                      <Col span={24}>
                        <div className="category-header">
                          {k} <Tag color="purple">{v.length}</Tag>
                        </div>
                      </Col>
                      {v.map((txt) => (
                        <Col key={txt} xs={6} sm={4} md={3} lg={2}>
                          <Button className="kaomoji-btn" onClick={() => safeCopy(txt)}>
                            {txt}
                          </Button>
                        </Col>
                      ))}
                    </Row>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default EmojisPage;
