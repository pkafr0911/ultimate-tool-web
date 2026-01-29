import React, { useMemo } from 'react';
import { List, Typography, Button, Tooltip, Empty, Badge } from 'antd';
import { UndoOutlined, RedoOutlined, HistoryOutlined, CheckCircleFilled } from '@ant-design/icons';
import { HistoryEntry } from '../hooks/useHistoryOptimized';

const { Text } = Typography;

interface HistoryPanelProps {
  entries: HistoryEntry[];
  currentIndex: number;
  onGoToEntry: (entryId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isProcessing: boolean;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  entries,
  currentIndex,
  onGoToEntry,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isProcessing,
}) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getEntryDescription = (entry: HistoryEntry, index: number): string => {
    if (entry.description) return entry.description;
    if (index === 0) return 'Initial state';
    if (entry.snapshot) return 'Snapshot';
    return 'Change';
  };

  // Reverse entries so newest is at top
  const reversedEntries = useMemo(() => {
    return entries.map((entry, index) => ({ entry, originalIndex: index })).reverse();
  }, [entries]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryOutlined />
          <Text strong>History</Text>
          <Badge count={entries.length} size="small" style={{ backgroundColor: '#1890ff' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="Undo (Ctrl+Z)">
            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo || isProcessing}
            />
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo || isProcessing}
            />
          </Tooltip>
        </div>
      </div>

      {/* History List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {entries.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No history yet"
            style={{ margin: '40px 0' }}
          />
        ) : (
          <List
            size="small"
            dataSource={reversedEntries}
            renderItem={({ entry, originalIndex }) => {
              const isCurrent = originalIndex === currentIndex;
              const isPast = originalIndex < currentIndex;

              return (
                <List.Item
                  onClick={() => !isProcessing && onGoToEntry(entry.id)}
                  style={{
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    padding: '8px 16px',
                    background: isCurrent ? '#e6f7ff' : isPast ? '#fafafa' : 'transparent',
                    borderLeft: isCurrent ? '3px solid #1890ff' : '3px solid transparent',
                    opacity: isProcessing ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent && !isProcessing) {
                      e.currentTarget.style.background = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.background = isPast ? '#fafafa' : 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    {/* Thumbnail */}
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid #d9d9d9',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: '#f0f0f0',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <HistoryOutlined style={{ color: '#999' }} />
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text
                          strong={isCurrent}
                          style={{
                            fontSize: 12,
                            color: isPast && !isCurrent ? '#999' : 'inherit',
                          }}
                          ellipsis
                        >
                          {getEntryDescription(entry, originalIndex)}
                        </Text>
                        {isCurrent && (
                          <CheckCircleFilled style={{ color: '#1890ff', fontSize: 12 }} />
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {formatTime(entry.timestamp)}
                      </Text>
                    </div>

                    {/* Index indicator */}
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 10,
                        background: '#f0f0f0',
                        padding: '2px 6px',
                        borderRadius: 10,
                      }}
                    >
                      #{originalIndex + 1}
                    </Text>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <Text type="secondary" style={{ fontSize: 11 }}>
          {currentIndex + 1} / {entries.length} states
        </Text>
      </div>
    </div>
  );
};

export default HistoryPanel;
