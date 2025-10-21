import { Button, InputNumber, Modal, Radio, Space, Switch, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'custom';

interface SetupModalProps {
  visible: boolean;
  onClose: () => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  rows: number;
  setRows: (v: number) => void;
  cols: number;
  setCols: (v: number) => void;
  mines: number;
  setMines: (v: number) => void;
  showTips: boolean;
  setShowTips: (v: boolean) => void;
  started: boolean;
  startGame: () => void;
  resetAll: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({
  visible,
  onClose,
  difficulty,
  setDifficulty,
  rows,
  setRows,
  cols,
  setCols,
  mines,
  setMines,
  showTips,
  setShowTips,
  started,
  startGame,
  resetAll,
}) => {
  // Local (temporary) states before confirming
  const [tempDifficulty, setTempDifficulty] = useState<Difficulty>(difficulty);
  const [tempRows, setTempRows] = useState(rows);
  const [tempCols, setTempCols] = useState(cols);
  const [tempMines, setTempMines] = useState(mines);
  const [tempShowTips, setTempShowTips] = useState(showTips);

  // Sync current values when modal opens
  useEffect(() => {
    if (visible) {
      setTempDifficulty(difficulty);
      setTempRows(rows);
      setTempCols(cols);
      setTempMines(mines);
      setTempShowTips(showTips);
    }
  }, [visible]);

  // Confirm and apply changes
  const handleConfirm = () => {
    const applyChanges = () => {
      setDifficulty(tempDifficulty);
      setRows(tempRows);
      setCols(tempCols);
      setMines(tempMines);
      setShowTips(tempShowTips);
      resetAll();
      onClose();
      message.success('Game setup updated!');
    };

    // Warn user if game already started
    if (started) {
      Modal.confirm({
        title: 'Restart Game?',
        content:
          'Changing settings will restart your current game and clear your progress. Continue?',
        okText: 'Yes, restart',
        cancelText: 'No, keep playing',
        centered: true,
        onOk: applyChanges,
      });
    } else {
      applyChanges();
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      maskClosable={false}
      centered
      title="Game Setup"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Difficulty */}
        <div>
          <Text strong>Difficulty:</Text>
          <Radio.Group
            value={tempDifficulty}
            onChange={(e) => setTempDifficulty(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', marginTop: 8, gap: 4 }}
          >
            <Radio value="beginner">Beginner (9×9, 10 mines)</Radio>
            <Radio value="intermediate">Intermediate (16×16, 40 mines)</Radio>
            <Radio value="advanced">Advanced (16×30, 99 mines)</Radio>
            <Radio value="custom">Custom</Radio>
          </Radio.Group>
        </div>

        {/* Custom fields */}
        {tempDifficulty === 'custom' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text>Rows:</Text>
            <InputNumber min={9} max={30} value={tempRows} onChange={(v) => setTempRows(v || 9)} />
            <Text>Cols:</Text>
            <InputNumber min={9} max={30} value={tempCols} onChange={(v) => setTempCols(v || 9)} />
            <Text>Mines:</Text>
            <InputNumber
              min={10}
              max={Math.max(10, Math.min(668, tempRows * tempCols - 1))}
              value={tempMines}
              onChange={(v) => setTempMines(v || 10)}
            />
          </div>
        )}

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Text>Show Tips:</Text>
          <Switch checked={tempShowTips} onChange={setTempShowTips} />
        </div>

        {/* Action buttons */}
        <Space style={{ justifyContent: 'flex-end', display: 'flex', marginTop: 8 }}>
          <Button onClick={onClose} danger>
            Cancel
          </Button>
          <Button type="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default SetupModal;
