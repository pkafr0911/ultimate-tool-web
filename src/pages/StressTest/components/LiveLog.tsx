import { ClockCircleOutlined } from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import React, { useEffect, useRef } from 'react';
import type { RequestResult } from '../types';
import { formatDuration, getStatusColor } from '../types';

const { Text } = Typography;

interface Props {
  results: RequestResult[];
}

const LiveLog: React.FC<Props> = ({ results }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [results]);

  return (
    <div className="liveLog" ref={containerRef}>
      {results.slice(-300).map((r) => (
        <div
          key={r.index}
          className={`logEntry ${r.status >= 200 && r.status < 400 ? 'success' : 'error'}`}
        >
          <span className="logTime">
            {new Date(r.timestamp).toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span className="logStatus">#{r.index + 1}</span>
          <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }} color="default">
            T{r.threadId}
          </Tag>
          <Tag color={getStatusColor(r.status)} style={{ fontSize: 11 }}>
            {r.status === 0 ? 'ERR' : r.status}
          </Tag>
          <span className="logDuration">{formatDuration(r.duration)}</span>
          {r.assertions.some((a) => !a.passed) && (
            <Tag color="warning" style={{ fontSize: 10, marginLeft: 4 }}>
              Assert Fail
            </Tag>
          )}
          {r.error && (
            <Text type="danger" style={{ marginLeft: 8, fontSize: 11 }}>
              {r.error}
            </Text>
          )}
        </div>
      ))}
      {results.length === 0 && (
        <Text type="secondary">No requests yet. Click "Run Test" to start.</Text>
      )}
    </div>
  );
};

export default LiveLog;
