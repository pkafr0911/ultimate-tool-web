import { handleCopy } from '@/helpers';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Input,
  List,
  Row,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tour,
  type TourProps,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { commonPatterns } from './constants';
import './styles.less';

const { TextArea, Search } = Input;
const { Paragraph, Text, Title } = Typography;
const { Panel } = Collapse;

interface MatchGroup {
  key: string;
  index: number;
  content: string;
  groups: string[];
}

const explainRegex = (pattern: string): { title: string; desc: string }[] => {
  const explanations: { title: string; desc: string }[] = [];

  if (!pattern) return [{ title: 'Empty', desc: 'No regex pattern entered.' }];

  try {
    // Simple tokenizer for explanation
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
      else if (token.startsWith('['))
        explanations.push({ title: token, desc: 'Character set/range' });
      else if (token.startsWith('(')) explanations.push({ title: token, desc: 'Group' });
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
  const [pattern, setPattern] = useState('^\\w+$');
  const [flags, setFlags] = useState('gm');
  const [text, setText] = useState('asdasd\n1234\n@hello');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [openTour, setOpenTour] = useState(false);

  const [error, setError] = useState('');
  const [highlightedHTML, setHighlightedHTML] = useState('');
  const [explanation, setExplanation] = useState<{ title: string; desc: string }[]>([]);
  const [matches, setMatches] = useState<MatchGroup[]>([]);
  const [replacedResult, setReplacedResult] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const highlightRef = useRef<HTMLDivElement>(null);

  const patternInputRef = useRef(null);
  const flagsInputRef = useRef(null);
  const replaceToggleRef = useRef(null);
  const editorRef = useRef(null);
  const infoTabsRef = useRef(null);
  const cheatsheetRef = useRef(null);

  const steps: TourProps['steps'] = [
    {
      title: 'Regex Pattern',
      description: 'Enter your regular expression here. No need for surrounding slashes.',
      target: () => patternInputRef.current,
    },
    {
      title: 'Flags',
      description: 'Set regex flags like "g" (global), "i" (case insensitive), or "m" (multiline).',
      target: () => flagsInputRef.current,
    },
    {
      title: 'Replace Mode',
      description:
        'Toggle this to test substitution. You can use capture groups like $1 in the replacement string.',
      target: () => replaceToggleRef.current,
    },
    {
      title: 'Test String',
      description: 'Type or paste your text here. Matches will be highlighted in real-time.',
      target: () => editorRef.current,
    },
    {
      title: 'Analysis & Tools',
      description: 'View detailed match info, token explanations, or pick from common patterns.',
      target: () => infoTabsRef.current,
    },
    {
      title: 'Cheatsheet',
      description: 'Quick reference for common regex syntax.',
      target: () => cheatsheetRef.current,
    },
  ];

  const processRegex = (p = pattern, f = flags, t = text, r = replaceText) => {
    try {
      setError('');
      setExplanation(explainRegex(p));

      if (!p) {
        setHighlightedHTML(t.replace(/\n/g, '<br/>'));
        setMatches([]);
        setReplacedResult(t);
        return;
      }

      const re = new RegExp(p, f);

      // 1. Highlighting & Matches
      let highlighted = '';
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const foundMatches: MatchGroup[] = [];
      let matchCount = 0;

      // We need to clone the regex for iteration if it's global, otherwise loop once
      const iterRegex = new RegExp(p, f.includes('g') ? f : f + 'g');

      // Prevent infinite loops with empty matches
      let loopSafety = 0;

      while ((match = iterRegex.exec(t)) !== null) {
        if (loopSafety++ > 10000) break; // Safety break

        const start = match.index;
        const end = start + match[0].length;
        const content = match[0];

        // Highlight
        highlighted += t.slice(lastIndex, start).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        highlighted += `<mark title="Match ${matchCount + 1}">${content
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</mark>`;
        lastIndex = end;

        // Store match info
        foundMatches.push({
          key: `${start}-${end}`,
          index: start,
          content: content,
          groups: match.slice(1),
        });

        matchCount++;

        if (!f.includes('g')) break;
        if (match[0].length === 0) iterRegex.lastIndex++; // Avoid infinite loop on zero-length matches
      }

      highlighted += t.slice(lastIndex).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      setHighlightedHTML(highlighted.replace(/\n/g, '<br/>'));
      setMatches(foundMatches);

      // 2. Replacement
      if (isReplaceMode) {
        setReplacedResult(t.replace(re, r));
      }
    } catch (e: any) {
      setError(e.message);
      setHighlightedHTML(t.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'));
      setMatches([]);
      setReplacedResult(t);
    }
  };

  useEffect(() => {
    processRegex(pattern, flags, text, replaceText);
  }, [pattern, flags, text, replaceText, isReplaceMode]);

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = e.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  const handlePatternClick = (newPattern: string, examples: string[]) => {
    setPattern(newPattern);
    handleCopy(newPattern);
    if (examples?.length) {
      setText(examples.join('\n'));
    }
  };

  const filteredPatterns = commonPatterns.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pattern.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Match',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: 'Groups',
      dataIndex: 'groups',
      key: 'groups',
      render: (groups: string[]) => (
        <Space wrap>
          {groups.map((g, i) => (
            <Tag key={i} color="blue">
              ${i + 1}: {g}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <div className="regex-container">
      <Row gutter={[16, 16]}>
        {/* LEFT COLUMN: Inputs & Editor */}

        <Col xs={24} lg={14} xl={15}>
          <Card
            title={
              <>
                {'🧪 Regex Editor'}
                <Button
                  type="text"
                  ghost
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setOpenTour(true)}
                />
              </>
            }
            className="regex-card"
            bordered={false}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Regex Input */}
              <div className="regex-input-group">
                <div ref={patternInputRef} style={{ flex: 1 }}>
                  <Input
                    addonBefore={<span className="regex-slash">/</span>}
                    addonAfter={<span className="regex-slash">/</span>}
                    placeholder="Expression"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="regex-pattern-input"
                    size="large"
                  />
                </div>
                <div ref={flagsInputRef}>
                  <Input
                    placeholder="Flags"
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    className="regex-flags-input"
                    size="large"
                    style={{ width: 100 }}
                  />
                </div>
              </div>

              {/* Replace Toggle & Input */}
              <div className="regex-controls" ref={replaceToggleRef}>
                <Space>
                  <Switch
                    checked={isReplaceMode}
                    onChange={setIsReplaceMode}
                    checkedChildren="Replace"
                    unCheckedChildren="Match"
                  />
                  {isReplaceMode && (
                    <Input
                      placeholder="Replacement string (e.g. $1)"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      style={{ width: 300 }}
                    />
                  )}
                </Space>
              </div>

              {error && <Alert message={error} type="error" showIcon />}

              {/* Text Editor Area */}
              <div className="regex-editor-container" ref={editorRef}>
                <div className="regex-label">Test String</div>
                <div className="regex-textarea-wrapper">
                  <div
                    ref={highlightRef}
                    className="regex-highlights"
                    dangerouslySetInnerHTML={{ __html: highlightedHTML }}
                  />
                  <TextArea
                    value={text}
                    onScroll={syncScroll}
                    onChange={(e) => setText(e.target.value)}
                    rows={10}
                    className="regex-textarea-overlay"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Replacement Result */}
              {isReplaceMode && (
                <div className="regex-result-container">
                  <div className="regex-label">Replacement Result</div>
                  <TextArea
                    value={replacedResult}
                    readOnly
                    rows={6}
                    className="regex-result-textarea"
                  />
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* RIGHT COLUMN: Info & Tools */}
        <Col xs={24} lg={10} xl={9}>
          <div ref={infoTabsRef} style={{ height: '100%' }}>
            <Card className="regex-card full-height" bordered={false} bodyStyle={{ padding: 0 }}>
              <Tabs
                defaultActiveKey="1"
                tabBarStyle={{ padding: '0 16px' }}
                items={[
                  {
                    key: '1',
                    label: 'Match Info',
                    children: (
                      <div className="regex-tab-content">
                        <div style={{ marginBottom: 12 }}>
                          <Text strong>{matches.length} matches found</Text>
                        </div>
                        <Table
                          dataSource={matches}
                          columns={columns}
                          size="small"
                          pagination={{ pageSize: 5 }}
                          scroll={{ x: 'max-content' }}
                        />
                      </div>
                    ),
                  },
                  {
                    key: '2',
                    label: 'Explanation',
                    children: (
                      <div className="regex-tab-content">
                        <List
                          itemLayout="horizontal"
                          dataSource={explanation}
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Tag color="geekblue">{item.title}</Tag>}
                                title={item.desc}
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    ),
                  },
                  {
                    key: '3',
                    label: 'Quick Ref',
                    children: (
                      <div className="regex-tab-content">
                        <Search
                          placeholder="Search patterns..."
                          allowClear
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ marginBottom: 12 }}
                        />
                        <div className="regex-patterns-list">
                          {filteredPatterns.length > 0 ? (
                            filteredPatterns.map((item) => (
                              <div
                                key={item.name}
                                className="regex-pattern-item"
                                onClick={() =>
                                  handlePatternClick(item.pattern, item.examples || [])
                                }
                              >
                                <div className="pattern-header">
                                  <Text strong>{item.name}</Text>
                                </div>
                                <Text type="secondary" code className="pattern-code">
                                  {item.pattern}
                                </Text>
                              </div>
                            ))
                          ) : (
                            <div style={{ textAlign: 'center', padding: 20 }}>
                              No patterns found
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* Cheatsheet / Guide Section */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <div ref={cheatsheetRef}>
            <Collapse
              ghost
              items={[
                {
                  key: '1',
                  label: '📘 Regex Cheatsheet & Guide',
                  children: (
                    <div className="regex-cheatsheet">
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <Title level={5}>Character Classes</Title>
                          <ul className="cheatsheet-list">
                            <li>
                              <code>.</code> Any character except newline
                            </li>
                            <li>
                              <code>\w</code> Word (a-z, A-Z, 0-9, _)
                            </li>
                            <li>
                              <code>\d</code> Digit (0-9)
                            </li>
                            <li>
                              <code>\s</code> Whitespace (space, tab, newline)
                            </li>
                            <li>
                              <code>[abc]</code> Any of a, b, or c
                            </li>
                            <li>
                              <code>[^abc]</code> Not a, b, or c
                            </li>
                          </ul>
                        </Col>
                        <Col span={8}>
                          <Title level={5}>Quantifiers</Title>
                          <ul className="cheatsheet-list">
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
                        </Col>
                        <Col span={8}>
                          <Title level={5}>Anchors & Groups</Title>
                          <ul className="cheatsheet-list">
                            <li>
                              <code>^</code> Start of string/line
                            </li>
                            <li>
                              <code>$</code> End of string/line
                            </li>
                            <li>
                              <code>(...)</code> Capturing group
                            </li>
                            <li>
                              <code>(?:...)</code> Non-capturing group
                            </li>
                            <li>
                              <code>|</code> OR operator
                            </li>
                          </ul>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Col>
      </Row>
      <Tour open={openTour} onClose={() => setOpenTour(false)} steps={steps} />
    </div>
  );
};

export default RegexTester;
