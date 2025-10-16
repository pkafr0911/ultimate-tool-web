import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, message } from 'antd';
import { CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { handleCopy } from '@/helpers';

const { Title, Text } = Typography;

type CommandItem = {
  category: string;
  cmd: string;
  desc: string;
};

const ubuntuCommands: CommandItem[] = [
  { category: 'Ubuntu', cmd: 'sudo apt update', desc: 'Update package lists' },
  { category: 'Ubuntu', cmd: 'sudo apt upgrade', desc: 'Upgrade installed packages' },
  { category: 'Ubuntu', cmd: 'ls -la', desc: 'List files with details' },
  { category: 'Ubuntu', cmd: 'cd /path/to/dir', desc: 'Change directory' },
  { category: 'Ubuntu', cmd: 'rm -rf folder', desc: 'Force remove a folder recursively' },
  { category: 'Ubuntu', cmd: 'cp file1 file2', desc: 'Copy file1 to file2' },
  {
    category: 'Ubuntu',
    cmd: 'sudo kill -9 $(sudo lsof -t -i:<port_number>)',
    desc: 'Kill a process running on a specific port',
  },
];

const gitCommands: CommandItem[] = [
  { category: 'Git', cmd: 'git clone <url>', desc: 'Clone a repository' },
  { category: 'Git', cmd: 'git status', desc: 'Show working tree status' },
  { category: 'Git', cmd: 'git add .', desc: 'Stage all changes' },
  { category: 'Git', cmd: 'git commit -m "message"', desc: 'Commit staged changes' },
  { category: 'Git', cmd: 'git push', desc: 'Push commits to remote' },
  { category: 'Git', cmd: 'git reset --hard HEAD~1', desc: 'Undo last commit completely' },
  { category: 'Git', cmd: 'git branch', desc: 'List all local branches' },
  { category: 'Git', cmd: 'git checkout -b <branch>', desc: 'Create and switch to a new branch' },
];

const dockerCommands: CommandItem[] = [
  { category: 'Docker', cmd: 'docker ps', desc: 'List running containers' },
  { category: 'Docker', cmd: 'docker ps -a', desc: 'List all containers (including stopped)' },
  { category: 'Docker', cmd: 'docker images', desc: 'List local Docker images' },
  { category: 'Docker', cmd: 'docker pull <image>', desc: 'Pull image from Docker Hub' },
  { category: 'Docker', cmd: 'docker run -d <image>', desc: 'Run container in detached mode' },
  { category: 'Docker', cmd: 'docker stop <container>', desc: 'Stop a running container' },
  { category: 'Docker', cmd: 'docker rm <container>', desc: 'Remove a stopped container' },
  { category: 'Docker', cmd: 'docker rmi <image>', desc: 'Remove an image' },
  {
    category: 'Docker',
    cmd: 'docker exec -it <container> bash',
    desc: 'Run bash inside container',
  },
  {
    category: 'Docker',
    cmd: 'docker cp <src> <container>:<dest>',
    desc: 'Copy files into a container',
  },
  {
    category: 'Docker',
    cmd: 'docker system prune',
    desc: 'Remove all unused containers, networks, and images',
  },
];

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
