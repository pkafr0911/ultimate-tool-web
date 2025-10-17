import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, message } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { handleCopy } from '@/helpers';
import { dockerCommands, gitCommands, ubuntuCommands } from './constants';

const { Title, Text } = Typography;

// ✅ Escape HTML entities before highlighting
const escapeHtml = (text: string) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ✅ Highlight search term safely
const highlightText = (text: string, search: string) => {
  const safeText = escapeHtml(text);
  if (!search) return safeText;
  const regex = new RegExp(`(${search})`, 'gi');
  return safeText.replace(regex, '<mark>$1</mark>');
};

const CommandsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const allCommands = [...ubuntuCommands, ...gitCommands, ...dockerCommands];
  const filteredCommands = allCommands.filter(
    (item) =>
      item.cmd.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Command Reference</Title>

      <Input
        prefix={<SearchOutlined />}
        placeholder="Search commands (e.g. copy, remove, branch)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 400, marginBottom: 24 }}
        allowClear
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        {['Ubuntu', 'Git', 'Docker'].map((category) => {
          const groupCommands = filteredCommands.filter((c) => c.category === category);
          if (groupCommands.length === 0) return null;

          return (
            <Card key={category} title={category} bordered>
              {groupCommands.map((cmd) => (
                <div
                  key={cmd.cmd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <code
                      style={{
                        background: '#f6f6f6',
                        padding: '4px 8px',
                        borderRadius: 4,
                        display: 'inline-block',
                        fontSize: 15,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightText(cmd.cmd, search),
                      }}
                    />
                    <br />
                    <span
                      style={{ color: '#666' }}
                      dangerouslySetInnerHTML={{
                        __html: highlightText(cmd.desc, search),
                      }}
                    />
                  </div>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(cmd.cmd)}
                    title="Copy command"
                  />
                </div>
              ))}
            </Card>
          );
        })}

        {filteredCommands.length === 0 && <Text type="secondary">No commands found.</Text>}
      </Space>
    </div>
  );
};

export default CommandsPage;
