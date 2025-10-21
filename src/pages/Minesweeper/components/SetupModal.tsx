import { Button, InputNumber, Modal, Radio, Switch, Typography } from 'antd';
import React from 'react';

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
  startGame,
  resetAll,
}) => {
  return (
    <Modal open={visible} onCancel={onClose} footer={null} centered title="Game Setup">
      {/* Difficulty selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Text strong>Difficulty:</Text>
          <Radio.Group
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', marginTop: 8, gap: 4 }}
          >
            <Radio value="beginner">Beginner (9×9, 10 mines)</Radio>
            <Radio value="intermediate">Intermediate (16×16, 40 mines)</Radio>
            <Radio value="advanced">Advanced (16×30, 99 mines)</Radio>
            <Radio value="custom">Custom</Radio>
          </Radio.Group>
        </div>

        {/* Custom fields */}
        {difficulty === 'custom' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text>Rows:</Text>
            <InputNumber min={9} max={30} value={rows} onChange={(v) => setRows(v || 9)} />
            <Text>Cols:</Text>
            <InputNumber min={9} max={30} value={cols} onChange={(v) => setCols(v || 9)} />
            <Text>Mines:</Text>
            <InputNumber
              min={10}
              max={Math.max(10, Math.min(668, rows * cols - 1))}
              value={mines}
              onChange={(v) => setMines(v || 10)}
            />
          </div>
        )}

        {/* Toggles */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Text>Show Tips:</Text>
          <Switch checked={showTips} onChange={setShowTips} />
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',

            justifyContent: 'center',
            gap: 8,
            marginTop: 16,
          }}
        >
          <Button
            style={{ width: '100%' }}
            type="primary"
            onClick={() => {
              startGame();
              onClose();
            }}
          >
            Start
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SetupModal;
