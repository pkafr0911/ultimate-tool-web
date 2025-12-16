import React from 'react';
import { Modal, List, Button, Typography, Tag, Space } from 'antd';
import { PRESETS, Preset, PresetType } from '../../utils/presets';
import { SnippetsOutlined } from '@ant-design/icons';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (data: any) => void;
  type: PresetType;
};

const { Text, Paragraph } = Typography;

const TemplateModal: React.FC<Props> = ({ open, onClose, onSelect, type }) => {
  const filteredPresets = PRESETS.filter((p) => p.type === type);

  return (
    <Modal
      title={
        <Space>
          <SnippetsOutlined />
          <span>Load Preset Template</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <List
        itemLayout="horizontal"
        dataSource={filteredPresets}
        renderItem={(item: Preset) => (
          <List.Item
            actions={[
              <Button
                key="load"
                type="primary"
                size="small"
                onClick={() => {
                  if (confirm('This will overwrite your current code. Continue?')) {
                    onSelect(item.data);
                    onClose();
                  }
                }}
              >
                Load
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{item.name}</Text>
                  <Tag color="blue">{item.type}</Tag>
                </Space>
              }
              description={
                <Paragraph type="secondary" style={{ margin: 0 }} ellipsis={{ rows: 2 }}>
                  {item.description}
                </Paragraph>
              }
            />
          </List.Item>
        )}
      />
      {filteredPresets.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
          No presets available for this mode.
        </div>
      )}
    </Modal>
  );
};

export default TemplateModal;
