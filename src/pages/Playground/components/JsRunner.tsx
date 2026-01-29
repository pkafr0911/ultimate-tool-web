import React, { useState } from 'react';
import { Card, Typography, Splitter, Button } from 'antd';
import { PlayCircleOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { prettifyJS } from '../utils/formatters';
import { DEFAULT_CODE } from '../constants';
import { useDarkMode } from '@/hooks/useDarkMode';
import { usePlaygroundState } from '../hooks/usePlaygroundState';
import PlaygroundToolbar from './common/PlaygroundToolbar';
import CodeEditor from './common/CodeEditor';
import TemplateModal from './common/TemplateModal';
import Console, { LogEntry } from './common/Console';

type Props = {
  onOpenSettings: () => void;
};

const { Title } = Typography;

const JsRunner: React.FC<Props> = ({ onOpenSettings }) => {
  const { darkMode } = useDarkMode();

  const [language, setLanguage] = usePlaygroundState<'javascript' | 'typescript'>(
    'playground_js_lang',
    'javascript',
  );

  const [code, setCode] = usePlaygroundState('playground_js_code', DEFAULT_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'editor' | 'preview'>('none');

  const runCode = () => {
    const newLogs: LogEntry[] = [];
    const origLog = console.log;
    const origErr = console.error;
    const origWarn = console.warn;
    const origInfo = console.info;
    const origAlert = window.alert;

    const addLog = (type: LogEntry['type'], args: any[]) => {
      newLogs.push({ type, args, timestamp: Date.now() });
    };

    console.log = (...args: any[]) => {
      addLog('log', args);
      origLog(...args);
    };

    console.error = (...args: any[]) => {
      addLog('error', args);
      origErr(...args);
    };

    console.warn = (...args: any[]) => {
      addLog('warn', args);
      origWarn(...args);
    };

    console.info = (...args: any[]) => {
      addLog('info', args);
      origInfo(...args);
    };

    window.alert = (msg: any) => {
      addLog('info', [`[Alert]: ${msg}`]);
    };

    try {
      const result = new Function(code)();
      if (result !== undefined) {
        addLog('log', ['Result:', result]);
      }
    } catch (err: any) {
      addLog('error', [err.message]);
    }

    console.log = origLog;
    console.error = origErr;
    console.warn = origWarn;
    console.info = origInfo;
    window.alert = origAlert;

    setLogs(newLogs);
  };

  const handleFormat = () => {
    prettifyJS(code, setCode, language);
  };

  const handleReset = () => {
    if (confirm('Reset code to default?')) {
      setCode(DEFAULT_CODE);
      setLanguage('javascript');
    }
  };

  return (
    <Card
      className="playground-card"
      variant="borderless"
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          padding: '8px 12px',
          background: darkMode ? '#1f1f1f' : '#fafafa',
          border: darkMode ? '1px solid #333' : '1px solid #e5e5e5',
          borderRadius: 8,
        }}
      >
        <PlaygroundToolbar
          onSettings={onOpenSettings}
          onTemplates={() => setIsTemplateModalOpen(true)}
          onFormat={handleFormat}
          onReset={handleReset}
          extraActions={
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={runCode}>
              Run
            </Button>
          }
        />
      </div>

      <TemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        type="javascript"
        onSelect={(data) => {
          setCode(data);
        }}
      />

      <div className="playground-splitter-container">
        <Splitter>
          <Splitter.Panel
            defaultSize="60%"
            min="20%"
            max="80%"
            className={`editor-pane ${fullscreenMode === 'editor' ? 'fullscreen' : ''} ${fullscreenMode === 'preview' ? 'hidden' : ''}`}
          >
            <div className="pane-header">
              <Title level={5} style={{ margin: 0 }}>
                {language === 'typescript' ? 'TypeScript Editor' : 'JavaScript Editor'}
              </Title>
              <Button
                icon={
                  fullscreenMode === 'editor' ? <FullscreenExitOutlined /> : <FullscreenOutlined />
                }
                onClick={() => setFullscreenMode((prev) => (prev === 'editor' ? 'none' : 'editor'))}
                size="small"
                type="text"
              />
            </div>
            <CodeEditor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val || '')}
            />
          </Splitter.Panel>

          <Splitter.Panel
            className={`preview-pane ${fullscreenMode === 'preview' ? 'fullscreen' : ''} ${fullscreenMode === 'editor' ? 'hidden' : ''}`}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: darkMode ? '#1e1e1e' : '#fff',
                color: darkMode ? '#d4d4d4' : '#000',
              }}
            >
              <div className="pane-header">
                <Title level={5} style={{ margin: 0 }}>
                  Console Output
                </Title>
                <Button
                  icon={
                    fullscreenMode === 'preview' ? (
                      <FullscreenExitOutlined />
                    ) : (
                      <FullscreenOutlined />
                    )
                  }
                  onClick={() =>
                    setFullscreenMode((prev) => (prev === 'preview' ? 'none' : 'preview'))
                  }
                  size="small"
                  type="text"
                />
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                <Console logs={logs} />
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </Card>
  );
};

export default JsRunner;
