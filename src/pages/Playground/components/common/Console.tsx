import React from 'react';
import { Typography } from 'antd';
import ObjectViewer from './ObjectViewer';
import { CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';

export type LogType = 'log' | 'warn' | 'error' | 'info';

export interface LogEntry {
  type: LogType;
  args: any[];
  timestamp: number;
}

type Props = {
  logs: LogEntry[];
};

const Console: React.FC<Props> = ({ logs }) => {
  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 13,
        padding: 8,
        height: '100%',
        overflow: 'auto',
      }}
    >
      {logs.length === 0 && (
        <div style={{ color: '#888', fontStyle: 'italic', padding: 8 }}>
          // Console output will appear here...
        </div>
      )}
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '4px 0',
            borderBottom: '1px solid rgba(128,128,128,0.1)',
            color: log.type === 'error' ? '#ff6b6b' : log.type === 'warn' ? '#fca130' : 'inherit',
            background:
              log.type === 'error'
                ? 'rgba(255,0,0,0.05)'
                : log.type === 'warn'
                  ? 'rgba(255,165,0,0.05)'
                  : 'transparent',
          }}
        >
          <div style={{ marginRight: 8, marginTop: 2 }}>
            {log.type === 'error' && <CloseCircleOutlined />}
            {log.type === 'warn' && <WarningOutlined />}
            {log.type === 'info' && <InfoCircleOutlined />}
          </div>
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {log.args.map((arg, i) => (
              <div key={i}>
                {typeof arg === 'object' && arg !== null ? (
                  <ObjectViewer data={arg} />
                ) : (
                  <span>{String(arg)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Console;
