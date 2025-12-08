import {
  ClearOutlined,
  CopyOutlined,
  HistoryOutlined,
  SettingOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  List,
  Row,
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

const RandomNumber: React.FC = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [displayNumber, setDisplayNumber] = useState<number | string>('—');
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [unique, setUnique] = useState(false);
  const [sortHistory, setSortHistory] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, []);

  const getRandomInt = (minVal: number, maxVal: number) => {
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  };

  const generateNumber = () => {
    if (min >= max) {
      message.error('Min must be less than Max');
      return;
    }

    // Check if we can generate a unique number
    if (unique) {
      const rangeSize = max - min + 1;
      if (history.length >= rangeSize) {
        message.warning('All numbers in this range have been generated! Clear history to restart.');
        return;
      }
    }

    setIsAnimating(true);
    setShowConfetti(false);

    // Animation duration
    const duration = 800;
    const intervalTime = 50;
    const startTime = Date.now();

    if (animationRef.current) clearInterval(animationRef.current);

    animationRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Show random numbers during animation
      setDisplayNumber(getRandomInt(min, max));

      if (elapsed >= duration) {
        if (animationRef.current) clearInterval(animationRef.current);
        finalizeGeneration();
      }
    }, intervalTime);
  };

  const finalizeGeneration = () => {
    let result: number;

    if (unique) {
      // Find a number that isn't in history
      // For small ranges, we can just filter. For large ranges, rejection sampling is better.
      const rangeSize = max - min + 1;

      if (rangeSize < 1000) {
        // Small range: create pool
        const pool: number[] = [];
        for (let i = min; i <= max; i++) {
          if (!history.includes(i)) pool.push(i);
        }
        result = pool[Math.floor(Math.random() * pool.length)];
      } else {
        // Large range: rejection sampling
        let candidate = getRandomInt(min, max);
        // Safety break after 100 tries (though unlikely to hit if history is small relative to range)
        let tries = 0;
        while (history.includes(candidate) && tries < 100) {
          candidate = getRandomInt(min, max);
          tries++;
        }
        // Fallback if rejection failed (very full history)
        if (history.includes(candidate)) {
          // Do the expensive check
          const pool: number[] = [];
          for (let i = min; i <= max; i++) {
            if (!history.includes(i)) pool.push(i);
          }
          result = pool[Math.floor(Math.random() * pool.length)];
        } else {
          result = candidate;
        }
      }
    } else {
      result = getRandomInt(min, max);
    }

    setCurrentNumber(result);
    setDisplayNumber(result);
    setHistory((prev) => [result, ...prev]);
    setIsAnimating(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setCurrentNumber(null);
    setDisplayNumber('—');
  };

  const handleCopy = (val: number) => {
    navigator.clipboard.writeText(val.toString());
    message.success('Copied to clipboard!');
  };

  const getDisplayedHistory = () => {
    if (sortHistory) {
      return [...history].sort((a, b) => a - b);
    }
    return history;
  };

  return (
    <div className="random-container">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      <Card className="random-card" bordered={false}>
        <Row gutter={[32, 32]}>
          {/* Left Side: Generator */}
          <Col xs={24} md={14} className="generator-section">
            <div className="header-section">
              <Title level={2} style={{ margin: 0 }}>
                🎲 Random Generator
              </Title>
              <Text type="secondary">Generate random numbers within a range</Text>
            </div>

            <div className="display-area">
              <div className={`result-number ${isAnimating ? 'animating' : ''}`}>
                {displayNumber}
              </div>
            </div>

            <div className="controls-area">
              <Space size="large" align="end" style={{ width: '100%', justifyContent: 'center' }}>
                <div className="input-group">
                  <div className="label">Min</div>
                  <InputNumber
                    value={min}
                    onChange={(v) => setMin(v || 0)}
                    className="range-input"
                    size="large"
                  />
                </div>
                <div className="input-group">
                  <div className="label">Max</div>
                  <InputNumber
                    value={max}
                    onChange={(v) => setMax(v || 0)}
                    className="range-input"
                    size="large"
                  />
                </div>
              </Space>

              <div className="options-row">
                <Space>
                  <Text>Unique numbers only</Text>
                  <Switch checked={unique} onChange={setUnique} />
                </Space>
              </div>

              <Button
                type="primary"
                size="large"
                block
                icon={<ThunderboltFilled />}
                className="generate-btn"
                onClick={generateNumber}
                loading={isAnimating}
              >
                {isAnimating ? 'Rolling...' : 'GENERATE'}
              </Button>
            </div>
          </Col>

          {/* Right Side: History */}
          <Col xs={24} md={10} className="history-section">
            <div className="history-header">
              <Space>
                <HistoryOutlined />
                <Text strong>History ({history.length})</Text>
              </Space>
              <Space>
                <Tooltip title="Sort History">
                  <Button
                    type={sortHistory ? 'primary' : 'default'}
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => setSortHistory(!sortHistory)}
                  />
                </Tooltip>
                <Tooltip title="Clear History">
                  <Button
                    danger
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearHistory}
                    disabled={history.length === 0}
                  />
                </Tooltip>
              </Space>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className="history-list-container">
              {history.length === 0 ? (
                <div className="empty-history">
                  <Text type="secondary">No numbers generated yet</Text>
                </div>
              ) : (
                <List
                  dataSource={getDisplayedHistory()}
                  renderItem={(item, index) => (
                    <List.Item className="history-item">
                      <Space>
                        <span className="history-index">
                          #{sortHistory ? index + 1 : history.length - index}
                        </span>
                        <span className="history-value">{item}</span>
                      </Space>
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        size="small"
                        onClick={() => handleCopy(item)}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RandomNumber;
