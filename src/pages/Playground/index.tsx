import React, { useState } from 'react';
import { Segmented, Typography, Space } from 'antd';
import { Html5Outlined, CodeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import HtmlPlayground from './components/HtmlPlayground';
import ReactPlayground from './components/ReactPlayground';
import JsRunner from './components/JsRunner';
import EditorSettingsModal from './components/EditorSettingsModal';
import { usePlaygroundState } from './hooks/usePlaygroundState';
import './styles.less';

const { Title } = Typography;

const PlaygroundPage: React.FC = () => {
  const [mode, setMode] = usePlaygroundState<'html' | 'react' | 'playground'>(
    'playground_mode',
    'html',
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const segmentedOption = [
    {
      label: (
        <div className="segmented-option">
          <Html5Outlined style={{ fontSize: 16, color: '#e34c26' }} />
          <span>HTML / CSS / JS</span>
        </div>
      ),
      value: 'html',
    },
    {
      label: (
        <div className="segmented-option">
          <CodeOutlined style={{ fontSize: 16, color: '#61dafb' }} />
          <span>React</span>
        </div>
      ),
      value: 'react',
    },
    {
      label: (
        <div className="segmented-option">
          <ThunderboltOutlined style={{ fontSize: 16, color: '#fadb14' }} />
          <span>JS / TS Runner</span>
        </div>
      ),
      value: 'playground',
    },
  ];

  return (
    <div className="playground-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          🧠 Ultimate Playground
        </Title>

        <Segmented
          options={segmentedOption}
          value={mode}
          onChange={(val) => setMode(val as any)}
          size="large"
          style={{
            background: 'linear-gradient(145deg, #f0f2f5, #ffffff)',
            padding: 4,
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        />
      </div>

      {mode === 'html' && <HtmlPlayground onOpenSettings={() => setIsModalOpen(true)} />}
      {mode === 'react' && <ReactPlayground onOpenSettings={() => setIsModalOpen(true)} />}
      {mode === 'playground' && <JsRunner onOpenSettings={() => setIsModalOpen(true)} />}

      <EditorSettingsModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default PlaygroundPage;
