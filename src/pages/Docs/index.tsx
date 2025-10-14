import React from 'react';
import { Card, Typography, List } from 'antd';
import { PageContainer } from '@ant-design/pro-components';

const { Title, Paragraph, Text } = Typography;

const DocsPage: React.FC = () => {
  const ubuntuCommands = [
    { cmd: 'sudo apt update', desc: 'Update package lists' },
    { cmd: 'sudo apt upgrade', desc: 'Upgrade installed packages' },
    { cmd: 'ls -la', desc: 'List files with details' },
    { cmd: 'cd /path/to/dir', desc: 'Change directory' },
  ];

  const gitCommands = [
    { cmd: 'git clone <url>', desc: 'Clone a repository' },
    { cmd: 'git status', desc: 'Show working tree status' },
    { cmd: 'git add .', desc: 'Stage all changes' },
    { cmd: 'git commit -m "message"', desc: 'Commit staged changes' },
    { cmd: 'git push', desc: 'Push commits to remote' },
  ];

  return (
    <Card title="Docs & Reference">
      <Typography>
        <Title level={4}>Ubuntu Common Commands</Title>
        <List
          dataSource={ubuntuCommands}
          renderItem={(item) => (
            <List.Item>
              <Text code>{item.cmd}</Text> — {item.desc}
            </List.Item>
          )}
        />
        <Title level={4}>Git Common Commands</Title>
        <List
          dataSource={gitCommands}
          renderItem={(item) => (
            <List.Item>
              <Text code>{item.cmd}</Text> — {item.desc}
            </List.Item>
          )}
        />
        <Paragraph type="secondary">
          You can extend this page with Markdown rendering or search functionality later.
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default DocsPage;
