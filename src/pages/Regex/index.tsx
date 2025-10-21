import { handleCopy } from '@/helpers';
import { Alert, Card, Input, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { commonPatterns } from './constants';
import './styles.less';

const { TextArea, Search } = Input;
const { Paragraph, Text, Title } = Typography;

const explainRegex = (pattern: string): string[] => {
  const explanations: string[] = [];

  if (!pattern) return ['No regex pattern entered.'];

  try {
    const tokens = pattern.match(/\\.|(\[\^?.*?\])|(\(\?:?.*?\))|([*+?^$|(){}])/g) || [];

    for (const token of tokens) {
      switch (token) {
        case '^':
          explanations.push('^ → Matches the start of a line or string.');
          break;
        case '$':
          explanations.push('$ → Matches the end of a line or string.');
          break;
        case '.':
          explanations.push('. → Matches any character except newline.');
          break;
        case '*':
          explanations.push('* → Matches 0 or more repetitions.');
          break;
        case '+':
          explanations.push('+ → Matches 1 or more repetitions.');
          break;
        case '?':
          explanations.push('? → Makes the previous token optional (0 or 1 times).');
          break;
        case '|':
          explanations.push('| → Acts as OR between patterns.');
          break;
        case '\\d':
          explanations.push('\\d → Matches any digit (0–9).');
          break;
        case '\\D':
          explanations.push('\\D → Matches any non-digit.');
          break;
        case '\\w':
          explanations.push('\\w → Matches any word character (letters, digits, underscore).');
          break;
        case '\\W':
          explanations.push('\\W → Matches any non-word character.');
          break;
        case '\\s':
          explanations.push('\\s → Matches whitespace (space, tab, newline).');
          break;
        case '\\S':
          explanations.push('\\S → Matches any non-whitespace character.');
          break;
        default:
          if (token.startsWith('[')) explanations.push(`${token} → Character set or range.`);
          else if (token.startsWith('('))
            explanations.push(`${token} → Capturing or non-capturing group.`);
          else if (token.startsWith('\\'))
            explanations.push(`${token} → Escaped character or special sequence.`);
          else explanations.push(`${token} → Literal character.`);
          break;
      }
    }

    if (explanations.length === 0)
      explanations.push('No special tokens found. Probably a literal string.');
  } catch (e: any) {
    explanations.push(`Error parsing regex: ${e.message}`);
  }

  return explanations;
};

const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState('^\\w+$');
  const [flags, setFlags] = useState('gm');
  const [text, setText] = useState('asdasd\n1234\n@hello');
  const [error, setError] = useState('');
  const [highlightedHTML, setHighlightedHTML] = useState('');
  const [explanation, setExplanation] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const updateHighlight = (p = pattern, f = flags, t = text) => {
    try {
      const re = new RegExp(p, f);
      setError('');
      setExplanation(explainRegex(p));

      let highlighted = '';
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = re.exec(t)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        highlighted += t.slice(lastIndex, start);
        highlighted += `<mark>${match[0]}</mark>`;
        lastIndex = end;
        if (re.lastIndex === match.index) re.lastIndex++;
      }

      highlighted += t.slice(lastIndex);
      setHighlightedHTML(highlighted.replace(/\n/g, '<br/>'));
    } catch (e: any) {
      setError(e.message);
      setHighlightedHTML(t.replace(/\n/g, '<br/>'));
      setExplanation([`Error: ${e.message}`]);
    }
  };

  useEffect(() => {
    updateHighlight(pattern, flags, text);
  }, [pattern, flags, text]);

  const syncScroll = () => {
    if (!textAreaRef.current || !highlightRef.current) return;
    highlightRef.current.scrollTop = textAreaRef.current.scrollTop;
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

  return (
    <Card className="regex-card-light" title="🧩 Regex Tester" variant={'borderless'}>
      {/* Page Description */}
      <Paragraph type="secondary" className="regex-description">
        This tool helps you{' '}
        <Text strong>test, debug, and understand Regular Expressions (Regex)</Text> in real time.
        Enter a regex pattern and text — matches will be highlighted instantly.
      </Paragraph>
      <div className="regex-header">
        <Input
          className="regex-input-light"
          placeholder="Enter regex pattern (without / /)"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
        <Input
          className="regex-flags-light"
          placeholder="Flags (e.g. gim)"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
        />
      </div>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Text',
            children: (
              <div className="regex-textarea-wrapper">
                <div
                  ref={highlightRef}
                  className="regex-highlights"
                  dangerouslySetInnerHTML={{ __html: highlightedHTML }}
                />
                <TextArea
                  ref={textAreaRef}
                  value={text}
                  onScroll={syncScroll}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="regex-textarea-overlay"
                />
              </div>
            ),
          },
          {
            key: '2',
            label: 'Explanation',
            children: (
              <div className="regex-explanation">
                {explanation.map((line, i) => (
                  <Paragraph key={i} className="regex-explain-line">
                    {line}
                  </Paragraph>
                ))}
              </div>
            ),
          },
        ]}
      />

      {error && <Alert message={`Error: ${error}`} type="error" showIcon />}

      {/* 🔹 Common Patterns Section */}
      <div className="regex-common-section">
        <h4>Common Regex Patterns</h4>

        {/* Search bar */}
        <Search
          placeholder="Search regex patterns..."
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 400, marginBottom: 12 }}
        />

        {/* Filtered results */}
        <div>
          <Space wrap>
            {filteredPatterns.map((item) => (
              <Tooltip key={item.name} title={item.pattern}>
                <Tag
                  color="cyan"
                  onClick={() => handlePatternClick(item.pattern, item.examples || [])}
                  style={{ cursor: 'pointer', fontSize: 13, padding: '4px 8px' }}
                >
                  {item.name}
                </Tag>
              </Tooltip>
            ))}
            {filteredPatterns.length === 0 && <Paragraph>No matching patterns found.</Paragraph>}
          </Space>
        </div>
        {/* --- User Guide Section --- */}
        <div className="regex-guide">
          <Title level={5}>📘 How to Use</Title>
          <Paragraph>
            <Text strong>1.</Text> Enter your <Text code>Regex Pattern</Text> and optional{' '}
            <Text code>Flags</Text>.<br />
            <Text strong>2.</Text> Type your sample text in the <Text code>Text</Text> tab.
            <br />
            <Text strong>3.</Text> Matches will be <mark>highlighted</mark> instantly.
            <br />
            <Text strong>4.</Text> Switch to the <Text code>Explanation</Text> tab to see a
            breakdown of each token.
            <br />
            <Text strong>5.</Text> Explore and copy from <Text code>Common Patterns</Text> for quick
            use.
            <br />
            <Text type="secondary">
              💡 Tip: Use flags like <Text code>g</Text> (global) or <Text code>i</Text> (ignore
              case) to modify behavior.
            </Text>
          </Paragraph>
        </div>
      </div>
    </Card>
  );
};

export default RegexTester;
