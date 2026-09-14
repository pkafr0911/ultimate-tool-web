import React, { useState } from 'react';
import { Modal, Input, Button, Table, Select, Space, InputNumber, Tabs, message } from 'antd';
import { PlusOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { CaseItem, CasePreset, RARITY_CONFIG, RarityGrade } from '../types';

interface CustomCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSaveCase: (newCase: CasePreset) => void;
}

export const CustomCaseModal: React.FC<CustomCaseModalProps> = ({
  open,
  onClose,
  onSaveCase,
}) => {
  const [caseTitle, setCaseTitle] = useState('My Custom Case');
  const [caseSubtitle, setCaseSubtitle] = useState('Custom Collection');
  const [items, setItems] = useState<CaseItem[]>([
    {
      id: 'custom-1',
      name: 'Item 1',
      skin: 'Standard Edition',
      rarity: 'mil-spec',
      weight: 50,
    },
    {
      id: 'custom-2',
      name: 'Item 2',
      skin: 'Special Edition',
      rarity: 'restricted',
      weight: 30,
    },
    {
      id: 'custom-3',
      name: 'Grand Prize',
      skin: 'Gold Jackpot',
      rarity: 'gold',
      weight: 5,
    },
  ]);

  const [bulkInput, setBulkInput] = useState('Alice\nBob\nCharlie\nDavid\nEve\nFrank');

  const handleAddItem = () => {
    const newItem: CaseItem = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: `Custom Item ${items.length + 1}`,
      skin: 'Skin',
      rarity: 'mil-spec',
      weight: 10,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof CaseItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const handleConvertBulkText = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

    if (lines.length === 0) {
      message.error('Please enter at least one name or item!');
      return;
    }

    const rarities: RarityGrade[] = [
      'mil-spec',
      'restricted',
      'classified',
      'covert',
      'gold',
    ];

    const converted: CaseItem[] = lines.map((line, idx) => {
      const rarity = idx === lines.length - 1 ? 'gold' : rarities[idx % (rarities.length - 1)];
      const weight = RARITY_CONFIG[rarity].weightDefault;
      return {
        id: `bulk-${idx}-${Date.now()}`,
        name: line,
        skin: 'Random Choice',
        rarity,
        weight,
      };
    });

    setItems(converted);
    message.success(`Imported ${lines.length} items from list!`);
  };

  const handleSave = () => {
    if (!caseTitle.trim()) {
      message.error('Please enter a case title!');
      return;
    }
    if (items.length < 2) {
      message.error('Case must contain at least 2 items!');
      return;
    }

    const newPreset: CasePreset = {
      id: `custom-case-${Date.now()}`,
      title: caseTitle.trim(),
      subtitle: caseSubtitle.trim() || 'Custom Collection',
      items,
      isCustom: true,
    };

    onSaveCase(newPreset);
    message.success('Custom Case saved successfully!');
    onClose();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CaseItem) => (
        <Input
          value={text}
          onChange={(e) => handleUpdateItem(record.id, 'name', e.target.value)}
        />
      ),
    },
    {
      title: 'Skin / Subtitle',
      dataIndex: 'skin',
      key: 'skin',
      render: (text: string, record: CaseItem) => (
        <Input
          value={text}
          onChange={(e) => handleUpdateItem(record.id, 'skin', e.target.value)}
        />
      ),
    },
    {
      title: 'Rarity',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity: RarityGrade, record: CaseItem) => (
        <Select
          value={rarity}
          onChange={(val) => handleUpdateItem(record.id, 'rarity', val)}
          style={{ width: 140 }}
        >
          {Object.entries(RARITY_CONFIG).map(([key, config]) => (
            <Select.Option key={key} value={key}>
              <span style={{ color: config.color }}>{config.name}</span>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Weight (%)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (weight: number, record: CaseItem) => (
        <InputNumber
          min={0.1}
          max={100}
          value={weight}
          onChange={(val) => handleUpdateItem(record.id, 'weight', val || 1)}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: any, record: CaseItem) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.id)}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      title="Create / Customize Case (Wheel of Names Integration)"
      width={720}
      okText="Save & Select Case"
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Input
          addonBefore="Case Title"
          value={caseTitle}
          onChange={(e) => setCaseTitle(e.target.value)}
          placeholder="e.g. My Custom Case"
        />
        <Input
          addonBefore="Subtitle"
          value={caseSubtitle}
          onChange={(e) => setCaseSubtitle(e.target.value)}
          placeholder="e.g. Wheel of Names Collection"
        />
      </Space>

      <Tabs
        items={[
          {
            key: 'manual',
            label: 'Item List Editor',
            children: (
              <div>
                <Table
                  dataSource={items}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                  style={{ marginTop: 12 }}
                >
                  Add Custom Item
                </Button>
              </div>
            ),
          },
          {
            key: 'bulk',
            label: 'Import from Wheel of Names / Text',
            children: (
              <div>
                <Input.TextArea
                  rows={8}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Paste names or items here (one per line)..."
                />
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleConvertBulkText}
                  style={{ marginTop: 12 }}
                >
                  Convert Text to CS:GO Case Items
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
