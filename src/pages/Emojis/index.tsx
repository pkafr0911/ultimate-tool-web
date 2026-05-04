import { handleCopy as helperCopy } from '@/helpers';
import {
  AppstoreOutlined,
  FireOutlined,
  FontSizeOutlined,
  GiftOutlined,
  HeartOutlined,
  PictureOutlined,
  SearchOutlined,
  SmileOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Button, Input, message, Segmented, Tag, Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid } from 'react-window';
import { EmojiEntry, loadEmojiData } from './fetchUnicodeEmoji';
import './styles.less';

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
  const [tab, setTab] = useState<'emoji' | 'kaomoji'>('emoji');
  const [emojiData, setEmojiData] = useState<Record<string, EmojiEntry[]>>({});
  const [kaomojiData, setKaomojiData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { emojis, kaomoji } = await loadEmojiData();
      setEmojiData(emojis);
      setKaomojiData(kaomoji);
      setLoading(false);
    })();
    try {
      const r = JSON.parse(localStorage.getItem('emoji-recent') || '[]');
      if (Array.isArray(r)) setRecent(r.slice(0, 24));
    } catch {
      // noop
    }
  }, []);

  const pickEmoji = (txt: string) => {
    safeCopy(txt);
    const next = [txt, ...recent.filter((x) => x !== txt)].slice(0, 24);
    setRecent(next);
    try {
      localStorage.setItem('emoji-recent', JSON.stringify(next));
    } catch {
      // noop
    }
  };

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

  const filteredKaomoji = useMemo(() => {
    if (!query.trim()) return kaomojiData;
    const q = query.toLowerCase();
    const out: Record<string, string[]> = {};
    for (const [k, arr] of Object.entries(kaomojiData)) {
      const f = arr.filter((e) => e.toLowerCase().includes(q));
      if (f.length) out[k] = f;
    }
    return out;
  }, [query, kaomojiData]);

  const totalEmojis = Object.values(filteredEmojis).reduce((s, a) => s + a.length, 0);
  const totalKaomoji = Object.values(filteredKaomoji).reduce((s, a) => s + a.length, 0);
  const allEmojiCount = Object.values(emojiData).reduce((s, a) => s + a.length, 0);
  const allKaomojiCount = Object.values(kaomojiData).reduce((s, a) => s + a.length, 0);

  const renderEmojiGrid = (items: EmojiEntry[]) => (
    <div className="virtualGridWrap">
      <AutoSizer>
        {({ height, width }) => {
          const cellSize = 64;
          const columnCount = Math.max(4, Math.floor(width / cellSize));
          const rowCount = Math.ceil(items.length / columnCount);
          return (
            <FixedSizeGrid
              columnCount={columnCount}
              columnWidth={cellSize}
              height={height}
              rowCount={rowCount}
              rowHeight={cellSize}
              width={width}
            >
              {({ columnIndex, rowIndex, style }) => {
                const idx = rowIndex * columnCount + columnIndex;
                const item = items[idx];
                if (!item) return null;
                return (
                  <div style={style} className="emojiCell">
                    <Tooltip title={`${item.name} · click to copy`}>
                      <button className="emojiBtn" onClick={() => pickEmoji(item.emoji)}>
                        {item.emoji}
                      </button>
                    </Tooltip>
                  </div>
                );
              }}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    </div>
  );

  return (
    <div className="container emojisPage">
      <div className="shell">
        {/* Hero */}
        <section className="hero">
          <div className="heroOverlay" />
          <div className="heroRow">
            <div className="heroTitleBlock">
              <span className="heroBadge">
                <SmileOutlined />
              </span>
              <div>
                <span className="heroEyebrow">Emoji &amp; Kaomoji Picker</span>
                <h1 className="heroTitle">Find the perfect ✨ vibe ✨ in milliseconds</h1>
                <p className="heroSubtitle">
                  Search across {allEmojiCount.toLocaleString()} Unicode emojis and{' '}
                  {allKaomojiCount}+ kaomoji. Click any tile to copy — your recent picks are
                  remembered.
                </p>
              </div>
            </div>
            <div className="heroActions">
              <Segmented
                size="large"
                value={tab}
                onChange={(v) => setTab(v as 'emoji' | 'kaomoji')}
                options={[
                  {
                    label: `Emoji · ${totalEmojis}`,
                    value: 'emoji',
                    icon: <SmileOutlined />,
                  },
                  {
                    label: `Kaomoji · ${totalKaomoji}`,
                    value: 'kaomoji',
                    icon: <FontSizeOutlined />,
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Search bar */}
        <section className="panel searchPanel">
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined className="searchIcon" />}
            placeholder="Search emoji name or paste an emoji to find variants…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="searchInput"
          />
          <div className="searchStats">
            <Tag className="statTag" color="processing">
              <AppstoreOutlined /> {tab === 'emoji' ? totalEmojis : totalKaomoji} matches
            </Tag>
            {query && (
              <Tag className="statTag" color="purple">
                Filtering “{query}”
              </Tag>
            )}
          </div>
        </section>

        {/* Recent */}
        {recent.length > 0 && tab === 'emoji' && !query && (
          <section className="panel recentPanel">
            <div className="panelHeader">
              <div className="panelTitle">
                <ThunderboltFilled /> Recently used
              </div>
              <Button
                type="text"
                size="small"
                onClick={() => {
                  setRecent([]);
                  try {
                    localStorage.removeItem('emoji-recent');
                  } catch {
                    // noop
                  }
                }}
              >
                Clear
              </Button>
            </div>
            <div className="recentRow">
              {recent.map((e, i) => (
                <Tooltip key={`${e}-${i}`} title="Click to copy again">
                  <button className="emojiBtn small" onClick={() => safeCopy(e)}>
                    {e}
                  </button>
                </Tooltip>
              ))}
            </div>
          </section>
        )}

        {/* Workspace */}
        <section className="panel workspacePanel">
          {loading ? (
            <div className="loadingState">Loading emoji dataset…</div>
          ) : tab === 'emoji' ? (
            <div className="categoryList">
              {Object.entries(filteredEmojis).map(([cat, items]) => (
                <div key={cat} className="categoryBlock">
                  <div className="categoryHeader">
                    <span className="categoryIcon">{categoryIconMap[cat]}</span>
                    <span className="categoryTitle">{cat}</span>
                    <Tag color="blue" className="catTag">
                      {items.length}
                    </Tag>
                  </div>
                  {renderEmojiGrid(items)}
                </div>
              ))}
              {totalEmojis === 0 && <div className="emptyState">No emoji matches “{query}”</div>}
            </div>
          ) : (
            <div className="categoryList">
              {Object.entries(filteredKaomoji).map(([cat, items]) => (
                <div key={cat} className="categoryBlock">
                  <div className="categoryHeader">
                    <span className="categoryIcon">
                      <FontSizeOutlined />
                    </span>
                    <span className="categoryTitle">{cat}</span>
                    <Tag color="purple" className="catTag">
                      {items.length}
                    </Tag>
                  </div>
                  <div className="kaomojiGrid">
                    {items.map((txt) => (
                      <Tooltip key={txt} title="Click to copy">
                        <button className="kaomojiBtn" onClick={() => safeCopy(txt)}>
                          {txt}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              ))}
              {totalKaomoji === 0 && <div className="emptyState">No kaomoji matches “{query}”</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EmojisPage;
