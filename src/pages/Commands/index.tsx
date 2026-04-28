import { handleCopy } from '@/helpers';
import {
  AppstoreOutlined,
  BranchesOutlined,
  CheckOutlined,
  CloudServerOutlined,
  CodeOutlined,
  ContainerOutlined,
  CopyOutlined,
  NodeIndexOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Button, Empty, Input, Tag, Tooltip } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  dockerCommands,
  gitCommands,
  kubernetesCommands,
  npmCommands,
  ubuntuCommands,
} from './constants';
import './styles.less';

const escapeHtml = (text: string) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tokenize on whitespace, drop empties, lowercase. Supports quoted phrases: "git commit"
const tokenize = (search: string): string[] => {
  const tokens: string[] = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(search)) !== null) {
    const t = (m[1] ?? m[2] ?? '').trim().toLowerCase();
    if (t) tokens.push(t);
  }
  return tokens;
};

// Highlight all tokens (case-insensitive) inside escaped text.
const highlightTokens = (text: string, tokens: string[]) => {
  const safeText = escapeHtml(text);
  if (tokens.length === 0) return safeText;
  const pattern = tokens
    .filter(Boolean)
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length) // longest first to avoid nested matches
    .join('|');
  if (!pattern) return safeText;
  const regex = new RegExp(`(${pattern})`, 'gi');
  return safeText.replace(regex, '<mark>$1</mark>');
};

type CategoryKey = 'Ubuntu' | 'Git' | 'Docker' | 'Kubernetes' | 'npm';

type CommandRow = {
  category: string;
  cmd: string;
  desc: string;
};

const CATEGORY_META: Record<
  CategoryKey,
  { icon: React.ReactNode; color: string; description: string }
> = {
  Ubuntu: {
    icon: <CodeOutlined />,
    color: 'linear-gradient(135deg, #e95420 0%, #77216f 100%)',
    description: 'Everyday shell commands for package management and files.',
  },
  Git: {
    icon: <BranchesOutlined />,
    color: 'linear-gradient(135deg, #f05033 0%, #8e44ad 100%)',
    description: 'Version control operations for branches, commits, and remotes.',
  },
  Docker: {
    icon: <ContainerOutlined />,
    color: 'linear-gradient(135deg, #2496ed 0%, #0db7ed 100%)',
    description: 'Container lifecycle, images, and system management.',
  },
  Kubernetes: {
    icon: <CloudServerOutlined />,
    color: 'linear-gradient(135deg, #326ce5 0%, #0f52ba 100%)',
    description: 'Cluster inspection, rollouts, and workload management.',
  },
  npm: {
    icon: <NodeIndexOutlined />,
    color: 'linear-gradient(135deg, #cb3837 0%, #f7b733 100%)',
    description: 'Node package management, scripts, and publishing.',
  },
};

const CATEGORY_ORDER: CategoryKey[] = ['Ubuntu', 'Git', 'Docker', 'Kubernetes', 'npm'];

// Score a command against tokens. All tokens must match (AND). Higher score = better match.
const scoreCommand = (item: CommandRow, tokens: string[]): number => {
  if (tokens.length === 0) return 1;
  const cmd = item.cmd.toLowerCase();
  const desc = item.desc.toLowerCase();
  const cat = item.category.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    const inCmd = cmd.includes(t);
    const inDesc = desc.includes(t);
    const inCat = cat.includes(t);
    if (!inCmd && !inDesc && !inCat) return 0; // AND semantics
    if (cmd === t) score += 100;
    else if (cmd.startsWith(t)) score += 40;
    else if (new RegExp(`\\b${escapeRegExp(t)}`).test(cmd)) score += 20;
    else if (inCmd) score += 10;
    if (inDesc) score += 5;
    if (inCat) score += 3;
  }
  // Slight bonus for shorter commands (more specific)
  score += Math.max(0, 20 - cmd.length * 0.1);
  return score;
};

const SEARCH_SUGGESTIONS = ['git commit', 'docker compose', 'kubectl logs', 'npm install', 'port'];

const CommandsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'All'>('All');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [sortByRelevance, setSortByRelevance] = useState(true);
  const searchRef = useRef<InputRef>(null);

  const allCommands = useMemo(
    () => [
      ...ubuntuCommands,
      ...gitCommands,
      ...dockerCommands,
      ...kubernetesCommands,
      ...npmCommands,
    ],
    [],
  );

  const tokens = useMemo(() => tokenize(search), [search]);

  const { filteredCommands, scoreMap } = useMemo(() => {
    const scores = new Map<string, number>();
    const filtered = allCommands.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      const s = scoreCommand(item, tokens);
      if (s <= 0) return false;
      scores.set(item.cmd, s);
      return true;
    });
    return { filteredCommands: filtered, scoreMap: scores };
  }, [allCommands, tokens, activeCategory]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: allCommands.length };
    for (const c of allCommands) map[c.category] = (map[c.category] || 0) + 1;
    return map;
  }, [allCommands]);

  // Keyboard shortcuts: "/" focuses search, Esc clears while focused.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable);

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current?.input) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onCopy = (cmd: string) => {
    handleCopy(cmd);
    setCopiedCmd(cmd);
    window.setTimeout(() => {
      setCopiedCmd((prev) => (prev === cmd ? null : prev));
    }, 1400);
  };

  const renderGroup = (category: CategoryKey, items: CommandRow[]) => {
    const meta = CATEGORY_META[category];
    return (
      <section className="category-section" key={category}>
        <div className="category-header">
          <span className="category-badge" style={{ background: meta.color }}>
            {meta.icon}
          </span>
          <h2>{category}</h2>
          <span className="category-count">
            {items.length} {items.length === 1 ? 'command' : 'commands'}
          </span>
        </div>

        <div className="command-grid">
          {items.map((cmd) => {
            const copied = copiedCmd === cmd.cmd;
            return (
              <div className="command-card" key={cmd.cmd}>
                <div className="command-cmd">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightTokens(cmd.cmd, tokens),
                    }}
                  />
                  <Tooltip title={copied ? 'Copied!' : 'Copy command'}>
                    <Button
                      className="copy-btn"
                      type={copied ? 'primary' : 'default'}
                      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => onCopy(cmd.cmd)}
                    />
                  </Tooltip>
                </div>
                <div
                  className="command-desc"
                  dangerouslySetInnerHTML={{
                    __html: highlightTokens(cmd.desc, tokens),
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const isSearching = tokens.length > 0;
  const showRelevanceList = isSearching && sortByRelevance;

  // Flat relevance-sorted list (used when actively searching).
  const relevanceSorted = useMemo(() => {
    if (!showRelevanceList) return [];
    return [...filteredCommands].sort(
      (a, b) => (scoreMap.get(b.cmd) || 0) - (scoreMap.get(a.cmd) || 0),
    );
  }, [filteredCommands, scoreMap, showRelevanceList]);

  return (
    <div className="commands-page">
      <div className="commands-container">
        <header className="commands-hero">
          <span className="hero-eyebrow">Developer Cheat Sheet</span>
          <h1>Command Reference</h1>
          <p className="hero-subtitle">
            A curated, searchable collection of the most-used Ubuntu, Git, and Docker commands — one
            click to copy.
          </p>
          <div className="hero-stats">
            <div className="stat-chip">
              <span className="stat-icon">
                <ThunderboltOutlined />
              </span>
              <span>
                <strong>{allCommands.length}</strong> commands
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-icon">
                <AppstoreOutlined />
              </span>
              <span>
                <strong>{CATEGORY_ORDER.length}</strong> categories
              </span>
            </div>
            {CATEGORY_ORDER.map((c) => (
              <div className="stat-chip" key={c}>
                <span className="stat-icon">{CATEGORY_META[c].icon}</span>
                <span>
                  {c} · <strong>{counts[c] || 0}</strong>
                </span>
              </div>
            ))}
          </div>
        </header>

        <div className="commands-toolbar">
          <Input
            ref={searchRef}
            className="commands-search"
            size="large"
            prefix={<SearchOutlined />}
            suffix={
              <span className="search-kbd" title='Press "/" to focus'>
                /
              </span>
            }
            placeholder='Search — multi-word & quoted phrases (e.g. git commit, "port forward")'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <div className="category-filters">
            <span
              className={`category-pill ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All <span className="count">{counts.All}</span>
            </span>
            {CATEGORY_ORDER.map((c) => (
              <span
                key={c}
                className={`category-pill ${activeCategory === c ? 'active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {CATEGORY_META[c].icon} {c} <span className="count">{counts[c] || 0}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Search status bar */}
        {(isSearching || activeCategory !== 'All') && (
          <div className="search-status">
            <div className="status-left">
              <strong>{filteredCommands.length}</strong>&nbsp;
              {filteredCommands.length === 1 ? 'result' : 'results'}
              {isSearching && (
                <>
                  {' '}
                  for{' '}
                  {tokens.map((t) => (
                    <Tag key={t} className="token-tag">
                      {t}
                    </Tag>
                  ))}
                </>
              )}
              {activeCategory !== 'All' && (
                <>
                  {' '}
                  in <Tag color="blue">{activeCategory}</Tag>
                </>
              )}
            </div>
            <div className="status-right">
              {isSearching && (
                <Button
                  size="small"
                  type="text"
                  onClick={() => setSortByRelevance((v) => !v)}
                  title="Toggle sort order"
                >
                  Sort: {sortByRelevance ? 'Relevance' : 'By category'}
                </Button>
              )}
              <Button size="small" type="link" onClick={() => setSearch('')}>
                Clear search
              </Button>
            </div>
          </div>
        )}

        {/* Suggestions when input is empty */}
        {!isSearching && activeCategory === 'All' && (
          <div className="search-suggestions">
            <span className="suggest-label">Try:</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <Tag key={s} className="suggest-tag" onClick={() => setSearch(s)}>
                {s}
              </Tag>
            ))}
          </div>
        )}

        {/* Results */}
        {showRelevanceList && relevanceSorted.length > 0 && (
          <section className="category-section">
            <div className="category-header">
              <span
                className="category-badge"
                style={{ background: 'linear-gradient(135deg, #13c2c2 0%, #1890ff 100%)' }}
              >
                <SearchOutlined />
              </span>
              <h2>Best matches</h2>
              <span className="category-count">
                {relevanceSorted.length} {relevanceSorted.length === 1 ? 'command' : 'commands'}
              </span>
            </div>

            <div className="command-grid">
              {relevanceSorted.map((cmd) => {
                const copied = copiedCmd === cmd.cmd;
                return (
                  <div className="command-card" key={cmd.cmd}>
                    <div className="command-cmd">
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightTokens(cmd.cmd, tokens),
                        }}
                      />
                      <Tooltip title={copied ? 'Copied!' : 'Copy command'}>
                        <Button
                          className="copy-btn"
                          type={copied ? 'primary' : 'default'}
                          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                          onClick={() => onCopy(cmd.cmd)}
                        />
                      </Tooltip>
                    </div>
                    <div className="command-card-meta">
                      <Tag className="meta-category">{cmd.category}</Tag>
                      <span
                        className="command-desc inline"
                        dangerouslySetInnerHTML={{
                          __html: highlightTokens(cmd.desc, tokens),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!showRelevanceList &&
          CATEGORY_ORDER.map((category) => {
            const groupCommands = filteredCommands.filter((c) => c.category === category);
            if (groupCommands.length === 0) return null;
            return renderGroup(category, groupCommands);
          })}

        {filteredCommands.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <SearchOutlined />
            </div>
            <Empty
              description={
                <span>
                  No commands match{' '}
                  {tokens.map((t) => (
                    <Tag key={t} className="token-tag">
                      {t}
                    </Tag>
                  ))}
                  {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}.
                </span>
              }
            />
            <Button type="link" onClick={() => setSearch('')}>
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandsPage;
