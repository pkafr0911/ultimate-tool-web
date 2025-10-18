import { Button, Card, InputNumber, Space, Typography } from 'antd';
import React, { useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title } = Typography;

const RandomNumber: React.FC = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);
  const [number, setNumber] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const generateNumber = () => {
    if (min > max) return;
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    setNumber(random);
    setShowConfetti(true);
    // Show confetti animation when there's a winner (15s)
    setTimeout(() => setShowConfetti(false), 15000);
  };

  return (
    <div className="random-light-container">
      {showConfetti && <Confetti />} {/* Show confetti animation when there's a winner */}
      <Card className="random-light-card" variant={'borderless'}>
        {/* Page Title */}
        <Title level={2} className="random-light-title">
          🎲 Random Number Generator
        </Title>
        <div className="random-light-header">
          <div className="random-light-number">{number ?? '—'}</div>
          <Space direction="vertical" size="middle" className="random-light-inputs">
            <div>
              <div className="input-label">Min</div>
              <InputNumber value={min} onChange={(v) => setMin(v || 0)} />
            </div>
            <div>
              <div className="input-label">Max</div>
              <InputNumber value={max} onChange={(v) => setMax(v || 0)} />
            </div>
          </Space>
        </div>

        <Button
          type="primary"
          size="large"
          block
          className="generate-btn-light"
          onClick={generateNumber}
        >
          GENERATE
        </Button>
      </Card>
    </div>
  );
};

export default RandomNumber;
