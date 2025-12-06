import React from 'react';

interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="log-container">
      {logs.length === 0 ? 'Waiting for events...' : logs.join('\n')}
    </div>
  );
};

export default LogViewer;
