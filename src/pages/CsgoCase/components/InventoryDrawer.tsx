import React, { useState } from 'react';
import { Drawer, List, Tag, Space, Button, Typography, Statistic, Row, Col, Popconfirm } from 'antd';
import { DeleteOutlined, TrophyOutlined, ThunderboltOutlined, DollarOutlined } from '@ant-design/icons';
import { RARITY_CONFIG, RarityGrade, UnboxedItem } from '../types';

const { Text } = Typography;

interface InventoryDrawerProps {
  open: boolean;
  onClose: () => void;
  inventory: UnboxedItem[];
  onClearInventory: () => void;
}

export const InventoryDrawer: React.FC<InventoryDrawerProps> = ({
  open,
  onClose,
  inventory,
  onClearInventory,
}) => {
  const [filterRarity, setFilterRarity] = useState<string>('all');

  const totalOpened = inventory.length;
  const totalSpent = totalOpened * 2.49; // $2.49 per key
  const knifeCount = inventory.filter((i) => i.item.rarity === 'gold').length;
  const covertCount = inventory.filter((i) => i.item.rarity === 'covert').length;
  const statTrakCount = inventory.filter((i) => i.isStatTrak).length;

  const filteredItems = inventory.filter((item) => {
    if (filterRarity === 'all') return true;
    return item.item.rarity === filterRarity;
  });

  return (
    <Drawer
      title="📦 Unboxed Inventory & Stats"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      className="csgo-inventory-drawer"
      extra={
        inventory.length > 0 && (
          <Popconfirm
            title="Clear Inventory?"
            description="Are you sure you want to clear your unboxed loot history?"
            onConfirm={onClearInventory}
            okText="Yes, Clear"
            cancelText="No"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Clear
            </Button>
          </Popconfirm>
        )
      }
    >
      {/* Stats Summary */}
      <div className="inventory-stats-card">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic title="Cases Opened" value={totalOpened} prefix={<TrophyOutlined />} />
          </Col>
          <Col span={12}>
            <Statistic
              title="Keys Spent"
              value={`$${totalSpent.toFixed(2)}`}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Knives Dropped"
              value={knifeCount}
              valueStyle={{ color: '#ffd700' }}
              prefix="★"
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="StatTrak™ Drops"
              value={statTrakCount}
              valueStyle={{ color: '#ff6600' }}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
        </Row>
      </div>

      {/* Filter Tabs */}
      <div className="rarity-filter-strip">
        <Space wrap>
          <Button
            size="small"
            type={filterRarity === 'all' ? 'primary' : 'default'}
            onClick={() => setFilterRarity('all')}
          >
            All ({inventory.length})
          </Button>
          {Object.entries(RARITY_CONFIG).map(([key, cfg]) => {
            const count = inventory.filter((i) => i.item.rarity === key).length;
            if (count === 0) return null;
            return (
              <Button
                key={key}
                size="small"
                type={filterRarity === key ? 'primary' : 'default'}
                style={{
                  borderColor: cfg.color,
                  color: filterRarity === key ? '#fff' : cfg.color,
                  backgroundColor: filterRarity === key ? cfg.color : 'transparent',
                }}
                onClick={() => setFilterRarity(key)}
              >
                {cfg.name} ({count})
              </Button>
            );
          })}
        </Space>
      </div>

      {/* List of Unboxed Items */}
      <div className="inventory-list-container">
        {filteredItems.length === 0 ? (
          <div className="empty-inventory">
            <Text type="secondary">No items in inventory yet. Open some cases!</Text>
          </div>
        ) : (
          <List
            dataSource={filteredItems}
            renderItem={(unboxed) => {
              const config = RARITY_CONFIG[unboxed.item.rarity] || RARITY_CONFIG['mil-spec'];
              return (
                <List.Item className="inventory-item">
                  <div
                    className="inventory-rarity-bar"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="inventory-item-body">
                    <div className="item-main-row">
                      <span className="item-name">{unboxed.item.name}</span>
                      <span className="item-skin" style={{ color: config.color }}>
                        {unboxed.item.skin}
                      </span>
                    </div>

                    <div className="item-sub-row">
                      <Space size="small">
                        <Tag color={config.color}>{config.name}</Tag>
                        {unboxed.isStatTrak && <Tag color="#ff6600">StatTrak™</Tag>}
                        <span className="wear-badge">{unboxed.wear}</span>
                      </Space>
                      <span className="float-badge">FV: {unboxed.floatValue.toFixed(4)}</span>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </Drawer>
  );
};
