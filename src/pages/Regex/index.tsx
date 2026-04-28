import { handleCopy } from '@/helpers';
import {
  BulbOutlined,
  CodeOutlined,
  CopyOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Pagination,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Tour,
  type TourProps,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { commonPatterns } from './constants';
import styles from './styles.less';

const { TextArea, Search } = Input;
const { Text } = Typography;

interface MatchGroup {
  key: string;
  index: number;
  content: string;
  groups: string[];
}

const SAMPLE_TEXT = `asdasd
1234
@hello
user@example.com
+84 987 654 321
https://example.com/path?q=1
2024-12-31`;

const explainRegex = (pattern: string): { title: string; desc: string }[] => {
  if (!pattern) return [{ title: 'Empty', desc: 'No regex pattern entered.' }];
  const explanations: { title: string; desc: string }[] = [];
  try {
    const tokens = pattern.match(/\\.|(\[\^?.*?\])|(\(\?:?.*?\))|([*+?^$|(){}])|./g) || [];
    for (const token of tokens) {
      if (token === '^') explanations.push({ title: '^', desc: 'Start of line/string' });
      else if (token === '$') explanations.push({ title: '$', desc: 'End of line/string' });
      else if (token === '.')
        explanations.push({ title: '.', desc: 'Any character (except newline)' });
      else if (token === '*') explanations.push({ title: '*', desc: '0 or more repetitions' });
      else if (token === '+') explanations.push({ title: '+', desc: '1 or more repetitions' });
      else if (token === '?') explanations.push({ title: '?', desc: 'Optional (0 or 1)' });
      else if (token === '|') explanations.push({ title: '|', desc: 'OR operator' });
      else if (token === '\\d') explanations.push({ title: '\\d', desc: 'Digit (0-9)' });
      else if (token === '\\D') explanations.push({ title: '\\D', desc: 'Non-digit' });
      else if (token === '\\w')
        explanations.push({ title: '\\w', desc: 'Word char (a-z, A-Z, 0-9, _)' });
      else if (token === '\\W') explanations.push({ title: '\\W', desc: 'Non-word char' });
      else if (token === '\\s') explanations.push({ title: '\\s', desc: 'Whitespace' });
      else if (token === '\\S') explanations.push({ title: '\\S', desc: 'Non-whitespace' });
      else if (token === '\\b') explanations.push({ title: '\\b', desc: 'Word boundary' });
      else if (token.startsWith('['))
        explanations.push({ title: token, desc: 'Character set/range' });
      else if (token.startsWith('(?:'))
        explanations.push({ title: token, desc: 'Non-capturing group' });
      else if (token.startsWith('(')) explanations.push({ title: token, desc: 'Capturing group' });
      else if (token.startsWith('\\'))
        explanations.push({ title: token, desc: 'Escaped character' });
      else explanations.push({ title: token, desc: 'Literal character' });
    }
  } catch (e: any) {
    explanations.push({ title: 'Error', desc: e.message });
  }
  return explanations;
};

const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState('^\\w+@[\\w.-]+\\.[A-Za-z]{2,}$');
  const [flags, setFlags] = useState('gm');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [openTour, setOpenTour] = useState(false);

  const [error, setError] = useState('');
  const [highlightedHTML, setHighlightedHTML] = useState('');
  const [explanation, setExplanation] = useState<{ title: string; desc: string }[]>([]);
  const [matches, setMatches] = useState<MatchGroup[]>([]);
  const [replacedResult, setReplacedResult] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [matchPage, setMatchPage] = useState(1);
  const matchPageSize = 6;

  const highlightRef = useRef<HTMLDivElement>(null);
  const patternInputRef = useRef<HTMLDivElement>(null);
  const flagsInputRef = useRef<HTMLDivElement>(null);
  const replaceToggleRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const infoTabsRef = useRef<HTMLDivElement>(null);

  const tourSteps: TourProps['steps'] = [
    {
      title: 'Pattern',
      description: 'Type your regular expression here. No surrounding slashes needed.',
      target: () => patternInputRef.current!,
    },
    {
      title: 'Flags',
      description: 'Common flags: g (global), i (case-insensitive), m (multiline), u, s, y.',
      target: () => flagsInputRef.current!,
    },
    {
      title: 'Replace mode',
      description: 'Enable to substitute matches. Use $1, $2 for capture groups.',
      target: () => replaceToggleRef.current!,
    },
    {
      title: 'Test string',
      description: 'Live highlight as you type — matches glow yellow.',
      target: () => editorRef.current!,
    },
    {
      title: 'Match info & quick patterns',
      description: 'Inspect captures, see token explanations, or pick from preset patterns.',
      target: () => infoTabsRef.current!,
    },
  ];

  const processRegex = (p = pattern, f = flags, t = text, r = replaceText) => {
    try {
      setError('');
      setExplanation(explainRegex(p));
      if (!p) {
        setHighlightedHTML(t.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'));
        setMatches([]);
        setReplacedResult(t);
        return;
      }
      const re = new RegExp(p, f);
      let highlighted = '';
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const found: MatchGroup[] = [];
      let n = 0;
      const iterRegex = new RegExp(p, f.includes('g') ? f : f + 'g');
      let safety = 0;
      while ((match = iterRegex.exec(t)) !== null) {
        if (safety++ > 10000) break;
        const start = match.index;
        const end = start + match[0].length;
        const content = match[0];
        highlighted += t.slice(lastIndex, start).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        highlighted += `<mark title="Match ${n + 1}">${content
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</mark>`;
        lastIndex = end;
        found.push({
          key: `${start}-${end}-${n}`,
          index: start,
          content,
          groups: match.slice(1),
        });
        n++;
        if (!f.includes('g')) break;
        if (match[0].length === 0) iterRegex.lastIndex++;
      }
      highlighted += t.slice(lastIndex).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      setHighlightedHTML(highlighted.replace(/\n/g, '<br/>'));
      setMatches(found);
      if (isReplaceMode) setReplacedResult(t.replace(re, r));
    } catch (e: any) {
      setError(e.message);
      setHighlightedHTML(t.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'));
      setMatches([]);
      setReplacedResult(t);
    }
  };

  useEffect(() => {
    processRegex(pattern, flags, text, replaceText);
    setMatchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, flags, text, replaceText, isReplaceMode]);

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  const handlePatternClick = (newPattern: string, examples: string[]) => {
    setPattern(newPattern);
    if (examples?.length) setText(examples.join('\n'));
  };

  const filteredPatterns = useMemo(
    () =>
      commonPatterns.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.pattern.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm],
  );

  const pagedMatches = matches.slice((matchPage - 1) * matchPageSize, matchPage * matchPageSize);

  const handleClear = () => {
    setPattern('');
    setText('');
    setReplaceText('');
  };

  const handleSample = () => {
    setPattern('^\\w+@[\\w.-]+\\.[A-Za-z]{2,}$');
    setFlags('gm');
    setText(SAMPLE_TEXT);
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        {/* === Hero === */}
        <header className={styles.hero}>
          <div className={styles.heroRow}>
            <div className={styles.heroTitleBlock}>
              <span className={styles.heroBadge}>
                <ExperimentOutlined />
              </span>
              <div className={styles.heroText}>
                <span className={styles.heroEyebrow}>Pattern Tool</span>
                <h1>Regex Tester &amp; Builder</h1>
                <p>
                  Live-highlight matches, inspect capture groups, replace with backrefs, and pick
                  from a curated library of common patterns.
                </p>
              </div>
            </div>

            <div className={styles.heroActions}>
              <Tooltip title="Load a sample pattern + text">
                <Button
                  className={styles.ghostBtn}
                  icon={<ReloadOutlined />}
                  onClick={handleSample}
                >
                  Sample
                </Button>
              </Tooltip>
              <Tooltip title="Clear everything">
                <Button className={styles.ghostBtn} onClick={handleClear}>
                  Clear
                </Button>
              </Tooltip>
              <Tooltip title="Take the guided tour">
                <Button
                  type="primary"
                  ghost
                  className={styles.ghostBtn}
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setOpenTour(true)}
                >
                  Tour
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className={styles.statStrip}>
            <div className={styles.statChip}>
              <span className={styles.dot} />
              <span>
                <strong>Live</strong> · auto-evaluate
              </span>
            </div>
            <div
              className={`${styles.statChip} ${error ? styles.statChipError : styles.statChipMatches}`}
            >
              <ThunderboltOutlined />
              <span>
                {error ? (
                  <strong>Invalid pattern</strong>
                ) : (
                  <>
                    Matches: <strong>{matches.length}</strong>
                  </>
                )}
              </span>
            </div>
            <div className={styles.statChip}>
              <CodeOutlined />
              <span>
                Pattern: <strong>{pattern.length} chars</strong>
              </span>
            </div>
            <div className={styles.statChip}>
              <span>
                Flags: <strong>{flags || '—'}</strong>
              </span>
            </div>
            <div className={styles.statChip}>
              <span>
                Mode: <strong>{isReplaceMode ? 'Replace' : 'Match'}</strong>
              </span>
            </div>
            <div className={styles.statChip}>
              <BulbOutlined />
              <span>
                Press <strong>Tour</strong> for a quick walkthrough
              </span>
            </div>
          </div>
        </header>

        {/* === Workspace === */}
        <div className={styles.workspace}>
          {/* Left: Editor */}
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                <ExperimentOutlined /> Editor
              </span>
              <Tooltip title="Copy pattern">
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(pattern, 'Copied pattern!')}
                >
                  Copy
                </Button>
              </Tooltip>
            </div>

            <div className={styles.patternRow}>
              <div ref={patternInputRef} className={styles.patternInputWrap}>
                <span className={styles.slash}>/</span>
                <Input
                  placeholder="Expression"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  size="large"
                  style={{
                    borderRadius: 0,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                />
                <span className={styles.slash}>/</span>
              </div>
              <div ref={flagsInputRef}>
                <Input
                  placeholder="gmi"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  size="large"
                  className={styles.flagsInput}
                />
              </div>
            </div>

            <div className={styles.controlsRow} ref={replaceToggleRef}>
              <span className={styles.controlsLabel}>Mode</span>
              <Switch
                checked={isReplaceMode}
                onChange={setIsReplaceMode}
                checkedChildren={
                  <>
                    <SwapOutlined /> Replace
                  </>
                }
                unCheckedChildren={
                  <>
                    <FileSearchOutlined /> Match
                  </>
                }
              />
              {isReplaceMode && (
                <Input
                  placeholder="Replacement (e.g. $1)"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
              )}
            </div>

            {error && <Alert message={error} type="error" showIcon banner />}

            <div>
              <div className={styles.editorLabel}>
                <span>Test String</span>
                <span>
                  {text.length.toLocaleString()} chars · {text.split('\n').length} lines
                </span>
              </div>
              <div className={styles.editorWrapper} ref={editorRef}>
                <div
                  ref={highlightRef}
                  className={styles.highlights}
                  dangerouslySetInnerHTML={{ __html: highlightedHTML }}
                />
                <TextArea
                  value={text}
                  onScroll={syncScroll}
                  onChange={(e) => setText(e.target.value)}
                  className={styles.textarea}
                  spellCheck={false}
                />
              </div>
            </div>

            {isReplaceMode && (
              <div>
                <div className={styles.editorLabel}>
                  <span>Replacement Result</span>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(replacedResult, 'Copied result!')}
                  >
                    Copy
                  </Button>
                </div>
                <pre className={styles.resultBox}>{replacedResult || '—'}</pre>
              </div>
            )}
          </section>

          {/* Right: Info / Patterns / Cheatsheet */}
          <section className={styles.panel} ref={infoTabsRef}>
            <Tabs
              defaultActiveKey="matches"
              className={styles.infoTabs}
              items={[
                {
                  key: 'matches',
                  label: (
                    <span>
                      <FileSearchOutlined /> Matches
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <div className={styles.matchSummary}>
                        <span>
                          <span className={styles.matchCount}>{matches.length}</span> match
                          {matches.length === 1 ? '' : 'es'} found
                        </span>
                        {matches.length > 0 && (
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() =>
                              handleCopy(
                                matches.map((m) => m.content).join('\n'),
                                'Copied all matches!',
                              )
                            }
                          >
                            Copy all
                          </Button>
                        )}
                      </div>
                      {matches.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matches yet" />
                      ) : (
                        <>
                          <List
                            size="small"
                            dataSource={pagedMatches}
                            renderItem={(m, i) => (
                              <List.Item
                                style={{ padding: '8px 4px' }}
                                actions={[
                                  <Tooltip title="Copy match" key="copy">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<CopyOutlined />}
                                      onClick={() => handleCopy(m.content, 'Copied match!')}
                                    />
                                  </Tooltip>,
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Tag color="purple">
                                      #{(matchPage - 1) * matchPageSize + i + 1}
                                    </Tag>
                                  }
                                  title={
                                    <Text code style={{ fontSize: 12.5 }}>
                                      {m.content || '(empty)'}
                                    </Text>
                                  }
                                  description={
                                    <span style={{ fontSize: 11.5 }}>
                                      idx {m.index}
                                      {m.groups.length > 0 && ' · groups: '}
                                      {m.groups.map((g, gi) => (
                                        <Tag
                                          key={gi}
                                          color="blue"
                                          style={{ marginLeft: 4, fontSize: 11 }}
                                        >
                                          ${gi + 1}: {g}
                                        </Tag>
                                      ))}
                                    </span>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                          {matches.length > matchPageSize && (
                            <Pagination
                              size="small"
                              current={matchPage}
                              pageSize={matchPageSize}
                              total={matches.length}
                              onChange={setMatchPage}
                              style={{ textAlign: 'center', marginTop: 8 }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'explain',
                  label: (
                    <span>
                      <BulbOutlined /> Explain
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <List
                        size="small"
                        dataSource={explanation}
                        renderItem={(item) => (
                          <List.Item style={{ padding: '6px 0' }}>
                            <List.Item.Meta
                              avatar={<Tag color="geekblue">{item.title}</Tag>}
                              title={
                                <span style={{ fontSize: 13, fontWeight: 400 }}>{item.desc}</span>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  ),
                },
                {
                  key: 'library',
                  label: (
                    <span>
                      <CodeOutlined /> Library
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <Search
                        placeholder="Search common patterns…"
                        allowClear
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 12 }}
                      />
                      {filteredPatterns.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No patterns" />
                      ) : (
                        <div className={styles.patternsList}>
                          {filteredPatterns.map((item) => (
                            <div
                              key={item.name}
                              className={styles.patternCard}
                              onClick={() => handlePatternClick(item.pattern, item.examples || [])}
                            >
                              <div className={styles.patternHeader}>
                                <span className={styles.patternName}>{item.name}</span>
                                <Tooltip title="Copy pattern">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(item.pattern, 'Copied pattern!');
                                    }}
                                  />
                                </Tooltip>
                              </div>
                              <code className={styles.patternCode}>{item.pattern}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </section>
        </div>

        {/* === Cheatsheet === */}
        <section className={styles.cheatsheet}>
          <div className={styles.cheatGroup}>
            <h4>Character Classes</h4>
            <ul className={styles.cheatList}>
              <li>
                <code>.</code> Any character (except newline)
              </li>
              <li>
                <code>\w</code> Word: a-z, A-Z, 0-9, _
              </li>
              <li>
                <code>\d</code> Digit 0-9
              </li>
              <li>
                <code>\s</code> Whitespace
              </li>
              <li>
                <code>[abc]</code> Any of a, b, c
              </li>
              <li>
                <code>[^abc]</code> Not a, b, c
              </li>
            </ul>
          </div>
          <div className={styles.cheatGroup}>
            <h4>Quantifiers</h4>
            <ul className={styles.cheatList}>
              <li>
                <code>*</code> 0 or more
              </li>
              <li>
                <code>+</code> 1 or more
              </li>
              <li>
                <code>?</code> 0 or 1
              </li>
              <li>
                <code>{'{3}'}</code> Exactly 3
              </li>
              <li>
                <code>{'{3,}'}</code> 3 or more
              </li>
              <li>
                <code>{'{3,5}'}</code> 3 to 5
              </li>
            </ul>
          </div>
          <div className={styles.cheatGroup}>
            <h4>Anchors &amp; Groups</h4>
            <ul className={styles.cheatList}>
              <li>
                <code>^</code> Start of line
              </li>
              <li>
                <code>$</code> End of line
              </li>
              <li>
                <code>\b</code> Word boundary
              </li>
              <li>
                <code>(...)</code> Capturing group
              </li>
              <li>
                <code>(?:...)</code> Non-capturing
              </li>
              <li>
                <code>|</code> OR
              </li>
            </ul>
          </div>
          <div className={styles.cheatGroup}>
            <h4>Flags</h4>
            <ul className={styles.cheatList}>
              <li>
                <code>g</code> Global
              </li>
              <li>
                <code>i</code> Case-insensitive
              </li>
              <li>
                <code>m</code> Multiline (^ $)
              </li>
              <li>
                <code>s</code> Dot matches newline
              </li>
              <li>
                <code>u</code> Unicode
              </li>
              <li>
                <code>y</code> Sticky
              </li>
            </ul>
          </div>
        </section>
      </div>

      <Tour open={openTour} onClose={() => setOpenTour(false)} steps={tourSteps} />
    </div>
  );
};

export default RegexTester;
