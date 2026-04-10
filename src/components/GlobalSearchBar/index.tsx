import { pages } from '@/constants';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import { AutoComplete, Input } from 'antd';
import React, { useMemo, useState } from 'react';
import './styles.less';

// --- Keyword tags for smarter search ---
// Maps tool names to extra keywords that describe their function/ability.
// These are checked alongside name, desc, and category during search.
const toolKeywords: Record<string, string[]> = {
  Playground: [
    'code',
    'run',
    'execute',
    'javascript',
    'typescript',
    'python',
    'script',
    'ide',
    'repl',
    'sandbox',
  ],
  'QR Generator': ['barcode', 'scan', 'link', 'url', 'share'],
  'Video Analyzer': ['video', 'stream', 'player', 'media', 'watch', 'mp4', 'youtube'],
  'Epoch Converter': ['timestamp', 'unix', 'date', 'time', 'convert', 'datetime'],
  'Regex Tester': ['regex', 'regexp', 'pattern', 'match', 'test', 'expression', 'string'],
  'UUID Generator': ['guid', 'id', 'unique', 'identifier', 'random'],
  'Password Generator': [
    'password',
    'security',
    'random',
    'strong',
    'secret',
    'credential',
    'hash',
  ],
  'JWT Encrypt/Decrypt': [
    'jwt',
    'token',
    'auth',
    'security',
    'encode',
    'decode',
    'encrypt',
    'decrypt',
    'authentication',
    'json web token',
  ],
  'Color Picker': ['color', 'hex', 'rgb', 'hsl', 'palette', 'design', 'css', 'theme', 'picker'],
  'Hex Converter': ['hex', 'hexadecimal', 'binary', 'encode', 'decode', 'dump', 'byte'],
  'AES Encrypt/Decrypt': [
    'aes',
    'encrypt',
    'decrypt',
    'cipher',
    'security',
    'crypto',
    'cryptography',
    'gcm',
    'cbc',
  ],
  'Stress Test': ['benchmark', 'performance', 'load', 'cpu', 'stress', 'test', 'speed'],
  'System Info': ['browser', 'device', 'system', 'hardware', 'info', 'detect', 'api', 'navigator'],
  'Keyboard Test': ['keyboard', 'key', 'press', 'input', 'device', 'hardware'],
  'Camera Test': ['camera', 'webcam', 'video', 'device', 'hardware', 'preview'],
  'Microphone Test': ['mic', 'microphone', 'audio', 'record', 'voice', 'device', 'sound'],
  'Headphone Test': [
    'headphone',
    'speaker',
    'audio',
    'sound',
    'channel',
    'left',
    'right',
    'device',
  ],
  'Gamepad Test': ['gamepad', 'controller', 'joystick', 'game', 'device', 'xbox', 'playstation'],
  'Image To Text': ['ocr', 'extract', 'recognize', 'scan', 'image', 'text', 'photo', 'picture'],
  'Text Art Generator': ['ascii', 'art', 'text', 'image', 'convert', 'pixel', 'picture'],
  'SVG Viewer': ['svg', 'vector', 'xml', 'view', 'inspect', 'image', 'graphic'],
  'Photo Editor': ['photo', 'image', 'edit', 'crop', 'resize', 'filter', 'photoshop', 'picture'],
  'Vector Editor': ['vector', 'draw', 'graphic', 'illustrator', 'svg', 'shape', 'design'],
  'Image Base64 Converter': ['base64', 'encode', 'decode', 'image', 'data uri', 'convert'],
  'Readme Editor': ['readme', 'markdown', 'md', 'document', 'write', 'preview'],
  'Json Formatter': ['json', 'format', 'validate', 'pretty', 'minify', 'data', 'parse', 'api'],
  'HTML Editor': ['html', 'web', 'page', 'edit', 'preview', 'css', 'markup'],
  'Mermaid Editor': [
    'mermaid',
    'diagram',
    'flowchart',
    'chart',
    'graph',
    'sequence',
    'uml',
    'visualization',
  ],
  '🎡 Wheel of Names': ['wheel', 'spin', 'random', 'pick', 'name', 'lottery', 'raffle', 'choose'],
  'Random Generator': ['random', 'number', 'dice', 'coin', 'flip', 'pick', 'generate', 'shuffle'],
  'Tic-Tac-Toe': ['game', 'play', 'fun', 'board', 'x', 'o', 'noughts', 'crosses'],
  'Snake xenzia': ['snake', 'game', 'play', 'fun', 'classic', 'retro', 'nokia'],
  Minesweeper: ['mine', 'game', 'play', 'fun', 'puzzle', 'bomb', 'classic'],
  Sudoku: ['sudoku', 'game', 'play', 'fun', 'puzzle', 'number', 'logic', 'brain'],
  Chess: ['chess', 'game', 'play', 'fun', 'board', 'strategy', 'piece', 'king', 'queen'],
  Commands: [
    'command',
    'cheatsheet',
    'reference',
    'docs',
    'cli',
    'terminal',
    'shell',
    'git',
    'shortcut',
  ],
  'Emojis /  Kaomojis ': ['emoji', 'kaomoji', 'emoticon', 'face', 'smiley', 'copy', 'unicode'],
  'Google Drive': ['drive', 'google', 'cloud', 'storage', 'file', 'upload', 'share'],
};

// Path prefix → category label
const categoryMap: Record<string, string> = {
  '/playground': 'Playground',
  '/utility/': 'Utility Tools',
  '/visual-tools/': 'Visual Tools',
  '/editor/': 'Editor',
  '/randomizer/': 'Randomizer',
  '/game/': 'Game',
  '/docs/': 'Docs',
};

const getCategory = (path: string): string => {
  for (const [prefix, label] of Object.entries(categoryMap)) {
    if (path.startsWith(prefix)) return label;
  }
  return '';
};

// Highlight matched text inside label
const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  // Escape regex special chars, split by space for multi-word highlight
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return text;
  const regex = new RegExp(`(${words.join('|')})`, 'ig');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ color: '#574b7e', fontWeight: 600 }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
};

// Compute a relevance score for ranking results
const scoreMatch = (page: (typeof pages)[0], words: string[]): number => {
  const name = page.name.toLowerCase();
  const desc = (page.desc || '').toLowerCase();
  const category = getCategory(page.path).toLowerCase();
  const keywords = (toolKeywords[page.name] || []).join(' ').toLowerCase();

  let score = 0;
  for (const w of words) {
    // Exact name match → highest
    if (name === w) score += 100;
    // Name starts with query word
    else if (name.startsWith(w)) score += 60;
    // Name contains query word
    else if (name.includes(w)) score += 40;
    // Category match (e.g. "game", "editor")
    if (category.includes(w)) score += 30;
    // Keyword/tag match (function/ability)
    if (keywords.includes(w)) score += 20;
    // Description match
    if (desc.includes(w)) score += 10;
  }
  return score;
};

const GlobalSearchBar: React.FC = () => {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const options = useMemo(() => {
    if (!value.trim()) return [];
    const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const scored = pages
      .map((p) => ({ page: p, score: scoreMatch(p, words) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(({ page }) => {
      const category = getCategory(page.path);
      return {
        value: page.name,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
              {page.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                {highlightMatch(page.name, value)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#888',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {highlightMatch(page.desc || '', value)}
              </div>
            </div>
            {category && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(87, 75, 126, 0.1)',
                  color: '#574b7e',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {category}
              </span>
            )}
          </div>
        ),
      };
    });
  }, [value]);

  const onSelect = (routeName: string) => {
    const selected = pages.find((p) => p.name === routeName);
    if (selected) {
      navigate(selected.path);
      setValue('');
    }
  };

  return (
    <div className={`global-search-wrapper`}>
      <AutoComplete
        defaultActiveFirstOption
        options={options}
        onSelect={onSelect}
        onSearch={setValue}
        value={value}
        popupMatchSelectWidth={420}
      >
        <Input
          size="large"
          placeholder="Search tools, categories, or features..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ borderRadius: 6 }}
        />
      </AutoComplete>
    </div>
  );
};

export default GlobalSearchBar;
