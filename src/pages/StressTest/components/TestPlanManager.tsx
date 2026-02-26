import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Input, List, message, Modal, Popconfirm, Space, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import type { TestConfig, TestPlan } from '../types';
import { DEFAULT_CONFIG, deleteTestPlan, generateId, loadTestPlans, saveTestPlan } from '../types';

const { Text } = Typography;

interface Props {
  config: TestConfig;
  onLoad: (config: TestConfig) => void;
  disabled?: boolean;
}

const TestPlanManager: React.FC<Props> = ({ config, onLoad, disabled }) => {
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    setPlans(loadTestPlans());
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) {
      message.warning('Please enter a name');
      return;
    }
    const plan: TestPlan = {
      id: editId || generateId(),
      name: saveName.trim(),
      config: { ...config },
      createdAt: editId ? plans.find((p) => p.id === editId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };
    saveTestPlan(plan);
    setPlans(loadTestPlans());
    setSaveName('');
    setEditId(null);
    message.success(`Test plan "${plan.name}" saved`);
  };

  const handleLoad = (plan: TestPlan) => {
    onLoad(plan.config);
    setModalOpen(false);
    message.success(`Loaded "${plan.name}"`);
  };

  const handleDelete = (id: string) => {
    deleteTestPlan(id);
    setPlans(loadTestPlans());
    message.success('Deleted');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stress-test-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          onLoad({ ...DEFAULT_CONFIG, ...imported });
          message.success('Test plan imported');
        } catch {
          message.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <>
      <Space wrap>
        <Input
          placeholder="Plan name..."
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          style={{ width: 200 }}
          disabled={disabled}
          size="small"
        />
        <Button
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={disabled}
          size="small"
          type="primary"
        >
          Save
        </Button>
        <Button
          icon={<FolderOpenOutlined />}
          onClick={() => {
            setPlans(loadTestPlans());
            setModalOpen(true);
          }}
          size="small"
        >
          Load ({plans.length})
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExportJson} size="small">
          Export JSON
        </Button>
        <Button icon={<UploadOutlined />} onClick={handleImportJson} size="small">
          Import JSON
        </Button>
      </Space>

      <Modal
        title="Saved Test Plans"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        {plans.length === 0 ? (
          <Text type="secondary">No saved test plans yet.</Text>
        ) : (
          <List
            dataSource={plans}
            renderItem={(plan) => (
              <List.Item
                actions={[
                  <Button size="small" type="link" onClick={() => handleLoad(plan)}>
                    Load
                  </Button>,
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setSaveName(plan.name);
                      setEditId(plan.id);
                      onLoad(plan.config);
                      setModalOpen(false);
                    }}
                  >
                    Edit
                  </Button>,
                  <Popconfirm
                    title="Delete this plan?"
                    onConfirm={() => handleDelete(plan.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button size="small" type="link" danger>
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={plan.name}
                  description={
                    <Space>
                      <Tag>{plan.config.method}</Tag>
                      <Text type="secondary" ellipsis style={{ maxWidth: 250, fontSize: 11 }}>
                        {plan.config.url || '(no URL)'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {new Date(plan.updatedAt).toLocaleDateString()}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};

export default TestPlanManager;
