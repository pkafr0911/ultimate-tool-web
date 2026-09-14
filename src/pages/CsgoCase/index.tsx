import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Dropdown, MenuProps, Row, Space, Switch, Tooltip, Typography, message } from 'antd';
import {
  SoundFilled,
  SoundOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  PlusOutlined,
  InboxOutlined,
  QuestionCircleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import Confetti from 'react-confetti';

import { CaseItem, CasePreset, UnboxedItem } from './types';
import { DEFAULT_PRESETS } from './utils/defaultPresets';
import { soundManager } from './utils/soundEffects';

import { ReelSpinner } from './components/ReelSpinner';
import { CaseGrid } from './components/CaseGrid';
import { InspectModal } from './components/InspectModal';
import { CustomCaseModal } from './components/CustomCaseModal';
import { InventoryDrawer } from './components/InventoryDrawer';

import './styles.less';

const { Title, Text } = Typography;

const CsgoCasePage: React.FC = () => {
  const [presets, setPresets] = useState<CasePreset[]>(DEFAULT_PRESETS);
  const [selectedCase, setSelectedCase] = useState<CasePreset>(DEFAULT_PRESETS[0]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [targetItem, setTargetItem] = useState<CaseItem | null>(null);

  const [unboxedWinner, setUnboxedWinner] = useState<UnboxedItem | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  const [inventory, setInventory] = useState<UnboxedItem[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fastSpin, setFastSpin] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load custom cases & inventory from localStorage
  useEffect(() => {
    try {
      const savedCustoms = localStorage.getItem('csgo-custom-cases');
      if (savedCustoms) {
        const parsed = JSON.parse(savedCustoms);
        setPresets([...DEFAULT_PRESETS, ...parsed]);
      }

      const savedInv = localStorage.getItem('csgo-case-inventory');
      if (savedInv) {
        setInventory(JSON.parse(savedInv));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  // Save inventory to localStorage
  const saveInventory = (newInv: UnboxedItem[]) => {
    setInventory(newInv);
    try {
      localStorage.setItem('csgo-case-inventory', JSON.stringify(newInv));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundManager.setMuted(!nextState);
  };

  // Pick weighted random item from selected case items
  const pickWinningItem = (items: CaseItem[]): CaseItem => {
    const totalWeight = items.reduce((acc, curr) => acc + (curr.weight || 1), 0);
    let randomNum = Math.random() * totalWeight;

    for (const item of items) {
      if (randomNum < (item.weight || 1)) {
        return item;
      }
      randomNum -= item.weight || 1;
    }

    return items[items.length - 1];
  };

  // Generate random float value & wear string
  const calculateWear = (floatVal: number): UnboxedItem['wear'] => {
    if (floatVal < 0.07) return 'Factory New';
    if (floatVal < 0.15) return 'Minimal Wear';
    if (floatVal < 0.38) return 'Field-Tested';
    if (floatVal < 0.45) return 'Well-Worn';
    return 'Battle-Scarred';
  };

  // Start Case Opening Spin
  const handleOpenCase = () => {
    if (selectedCase.items.length < 2) {
      message.error('Selected case must contain at least 2 items!');
      return;
    }
    if (isSpinning) return;

    const winnerItem = pickWinningItem(selectedCase.items);
    setTargetItem(winnerItem);
    setIsSpinning(true);
    setIsInspectModalOpen(false);
    setShowConfetti(false);
  };

  // Handle spin completion callback
  const handleSpinEnd = (winner: CaseItem) => {
    setIsSpinning(false);

    // Calculate item wear & stat-trak
    const floatValue = Math.random() * 0.999 + 0.001;
    const wear = calculateWear(floatValue);
    const isStatTrak = Math.random() < 0.1; // 10% chance
    const statTrakCount = isStatTrak ? Math.floor(Math.random() * 250) + 1 : undefined;

    const newUnboxed: UnboxedItem = {
      id: `unboxed-${Date.now()}-${Math.random()}`,
      item: winner,
      floatValue,
      wear,
      isStatTrak,
      statTrakCount,
      timestamp: Date.now(),
      caseTitle: selectedCase.title,
    };

    setUnboxedWinner(newUnboxed);
    saveInventory([newUnboxed, ...inventory]);

    // Play reveal fanfare
    soundManager.playReveal(winner.rarity);

    if (winner.rarity === 'covert' || winner.rarity === 'gold') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
    }

    setIsInspectModalOpen(true);
  };

  // Handle saving a custom case
  const handleSaveCustomCase = (newPreset: CasePreset) => {
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    setSelectedCase(newPreset);

    // Save custom presets
    const customsOnly = updatedPresets.filter((p) => p.isCustom);
    try {
      localStorage.setItem('csgo-custom-cases', JSON.stringify(customsOnly));
    } catch (e) {
      console.warn('Save custom case error:', e);
    }
  };

  const handleClearInventory = () => {
    saveInventory([]);
    message.success('Inventory cleared!');
  };

  const presetMenuItems: MenuProps['items'] = presets.map((p) => ({
    key: p.id,
    label: (
      <div style={{ padding: '4px 8px' }}>
        <div style={{ fontWeight: 700 }}>{p.title}</div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>{p.subtitle}</div>
      </div>
    ),
    onClick: () => setSelectedCase(p),
  }));

  return (
    <div className="csgo-case-page">
      {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}

      <Card className="csgo-hud-card" bordered={false}>
        {/* Header HUD Toolbar */}
        <Row align="middle" justify="space-between" className="csgo-header-row" gutter={[16, 16]}>
          <Col>
            <Space align="center" size="middle">
              <GiftOutlined style={{ fontSize: '2rem', color: '#ffc700' }} />
              <div>
                <Title level={3} className="csgo-title">
                  {selectedCase.title}
                </Title>
                <Text className="csgo-subtitle">{selectedCase.subtitle}</Text>
              </div>
            </Space>
          </Col>

          <Col>
            <Space wrap size="middle">
              <Dropdown menu={{ items: presetMenuItems }} trigger={['click']}>
                <Button size="large" style={{ fontWeight: 700, minWidth: 180 }}>
                  Select Case <DownOutlined />
                </Button>
              </Dropdown>

              <Button
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setIsCustomModalOpen(true)}
              >
                Create Custom Case
              </Button>

              <Tooltip title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}>
                <Button
                  size="large"
                  icon={soundEnabled ? <SoundFilled /> : <SoundOutlined />}
                  onClick={handleToggleSound}
                />
              </Tooltip>

              <Tooltip title="Fast Unbox Animation">
                <Button
                  size="large"
                  type={fastSpin ? 'primary' : 'default'}
                  icon={<ThunderboltOutlined />}
                  onClick={() => setFastSpin(!fastSpin)}
                >
                  Fast
                </Button>
              </Tooltip>

              <Button
                size="large"
                type="primary"
                icon={<InboxOutlined />}
                onClick={() => setIsInventoryOpen(true)}
                style={{ backgroundColor: '#1890ff', fontWeight: 700 }}
              >
                Inventory ({inventory.length})
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 1:1 CS:GO Reel Spinner Component */}
        <ReelSpinner
          items={selectedCase.items}
          isSpinning={isSpinning}
          targetItem={targetItem}
          onSpinEnd={handleSpinEnd}
          fastSpin={fastSpin}
        />

        {/* Unlock Container Main Action Button */}
        <div className="open-case-controls">
          <Button
            type="primary"
            size="large"
            className="unlock-btn"
            onClick={handleOpenCase}
            disabled={isSpinning}
          >
            {isSpinning ? 'UNLOCKING CONTAINER...' : 'UNLOCK CONTAINER'}
          </Button>
        </div>

        {/* Items Grid (1:1 CS:GO Screenshot replica) */}
        <CaseGrid
          items={selectedCase.items}
          onSelectItem={(item) => {
            const tempUnboxed: UnboxedItem = {
              id: `inspect-${Date.now()}`,
              item,
              floatValue: 0.01542,
              wear: 'Factory New',
              isStatTrak: true,
              statTrakCount: 1337,
              timestamp: Date.now(),
              caseTitle: selectedCase.title,
            };
            setUnboxedWinner(tempUnboxed);
            setIsInspectModalOpen(true);
          }}
        />
      </Card>

      {/* Inspect / Victory Modal */}
      <InspectModal
        open={isInspectModalOpen}
        unboxedItem={unboxedWinner}
        onClose={() => setIsInspectModalOpen(false)}
        onOpenAgain={() => {
          setIsInspectModalOpen(false);
          setTimeout(() => handleOpenCase(), 200);
        }}
      />

      {/* Custom Case Creator / Editor Modal */}
      <CustomCaseModal
        open={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSaveCase={handleSaveCustomCase}
      />

      {/* Inventory & Stats Drawer */}
      <InventoryDrawer
        open={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={inventory}
        onClearInventory={handleClearInventory}
      />
    </div>
  );
};

export default CsgoCasePage;
