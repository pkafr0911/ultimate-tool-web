import {
  ClearOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  SoundOutlined,
  SoundFilled,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  List,
  message,
  Modal,
  Row,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

// Extended material colors
const COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#607D8B',
];

const WheelOfNames: React.FC = () => {
  const [nameInput, setNameInput] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [canvasSize, setCanvasSize] = useState(500);
  const [removeAfterWin, setRemoveAfterWin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSegmentRef = useRef<number>(0);

  // Load from local storage
  useEffect(() => {
    const savedNames = localStorage.getItem('wheel-of-names-list');
    if (savedNames) {
      setNameInput(savedNames);
      setNames(savedNames.split('\n').filter((n) => n.trim() !== ''));
    } else {
      const defaultNames = 'Alice\nBob\nCharlie\nDavid\nEve\nFrank';
      setNameInput(defaultNames);
      setNames(defaultNames.split('\n'));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('wheel-of-names-list', nameInput);
    setNames(nameInput.split('\n').filter((n) => n.trim() !== ''));
  }, [nameInput]);

  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth * 0.9, 500);
      setCanvasSize(size);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, names, canvasSize]);

  const playTick = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx?.state === 'suspended') {
        ctx.resume();
      }
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.05);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error('Audio error', e);
    }
  };

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = names.length || 1;
    const arc = (2 * Math.PI) / total;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate((angle * Math.PI) / 180);

    // Draw segments
    names.forEach((name, i) => {
      const startAngle = i * arc;
      const endAngle = (i + 1) * arc;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 10, startAngle, endAngle);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.font = `bold ${Math.max(12, radius / 10)}px sans-serif`;
      ctx.translate(
        Math.cos(startAngle + arc / 2) * (radius * 0.65),
        Math.sin(startAngle + arc / 2) * (radius * 0.65),
      );
      ctx.rotate(startAngle + arc / 2);
      const text = name.length > 15 ? name.substring(0, 15) + '...' : name;
      ctx.fillText(text, -ctx.measureText(text).width / 2, 5);
      ctx.restore();
    });

    // Draw outer rim
    ctx.beginPath();
    ctx.arc(0, 0, radius - 5, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Draw center hub
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Center text
    if (!spinning) {
      ctx.fillStyle = '#333';
      ctx.font = `bold ${radius * 0.05}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SPIN', 0, 0);
    }

    ctx.restore();
  };

  const handleSpin = () => {
    if (names.length < 2) {
      message.error('Add at least two names!');
      return;
    }
    if (spinning) return;

    setWinner(null);
    setSpinning(true);
    setIsWinnerModalOpen(false);

    // Random spin between 5 and 10 seconds worth of rotation
    const spinAngle = 360 * 5 + Math.floor(Math.random() * 360);
    const newRotation = rotation + spinAngle;
    animateSpin(rotation, newRotation, 5000);
  };

  const animateSpin = (start: number, end: number, duration: number) => {
    const startTime = Date.now();
    lastSegmentRef.current = Math.floor(start / (360 / names.length));

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = start + (end - start) * easeOut;

      setRotation(currentRotation);

      // Sound check
      const segmentAngle = 360 / names.length;
      // We need to check how many segments we've passed
      // The pointer is at 0 degrees (right side).
      // The wheel rotates clockwise (positive angle).
      // The segment passing the pointer is determined by (360 - (rotation % 360))
      const normalizedRotation = currentRotation % 360;
      const currentSegmentIndex = Math.floor((360 - normalizedRotation) / segmentAngle);

      if (currentSegmentIndex !== lastSegmentRef.current) {
        playTick();
        lastSegmentRef.current = currentSegmentIndex;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const normalized = ((end % 360) + 360) % 360;
        const segment = 360 / names.length;
        const winnerIndex = Math.floor((360 - normalized) / segment) % names.length;
        const selectedWinner = names[winnerIndex];

        setWinner(selectedWinner);
        setSpinning(false);
        setShowConfetti(true);
        setIsWinnerModalOpen(true);
        // Stop confetti after 8 seconds
        setTimeout(() => setShowConfetti(false), 8000);
      }
    };
    requestAnimationFrame(animate);
  };

  const handleShuffle = () => {
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    setNameInput(shuffled.join('\n'));
  };

  const handleSort = () => {
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    setNameInput(sorted.join('\n'));
  };

  const handleClear = () => {
    Modal.confirm({
      title: 'Clear all names?',
      onOk: () => setNameInput(''),
    });
  };

  const handleRemoveWinner = () => {
    if (winner) {
      const newNames = names.filter((n) => n !== winner);
      setNameInput(newNames.join('\n'));
      setIsWinnerModalOpen(false);
      message.success(`Removed ${winner} from the list`);
    }
  };

  const handleCloseModal = () => {
    setIsWinnerModalOpen(false);
    if (removeAfterWin) {
      handleRemoveWinner();
    }
  };

  return (
    <div className="wheel-container">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

      <Card className="wheel-card" bordered={false}>
        <Row gutter={[32, 32]} align="middle" justify="center">
          {/* Left Column: Wheel */}
          <Col xs={24} lg={14} className="wheel-column">
            <div className="wheel-wrapper">
              <div className="wheel-pointer" />
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                onClick={handleSpin}
                style={{ cursor: spinning ? 'not-allowed' : 'pointer' }}
              />
            </div>
          </Col>

          {/* Right Column: Controls */}
          <Col xs={24} lg={10} className="controls-column">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="header-section">
                <Title level={2} style={{ margin: 0 }}>
                  🎡 Wheel of Names
                </Title>
                <Text type="secondary">Customize your wheel and spin to pick a random winner!</Text>
              </div>

              <div className="controls-toolbar">
                <Space wrap>
                  <Tooltip title="Shuffle Names">
                    <Button icon={<ReloadOutlined />} onClick={handleShuffle} />
                  </Tooltip>
                  <Tooltip title="Sort A-Z">
                    <Button icon={<SortAscendingOutlined />} onClick={handleSort} />
                  </Tooltip>
                  <Tooltip title="Clear All">
                    <Button icon={<ClearOutlined />} onClick={handleClear} danger />
                  </Tooltip>
                  <Tooltip title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}>
                    <Button
                      icon={soundEnabled ? <SoundFilled /> : <SoundOutlined />}
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    />
                  </Tooltip>
                </Space>
              </div>

              <Input.TextArea
                rows={10}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter names here (one per line)"
                className="names-input"
              />

              <div className="spin-section">
                <Checkbox
                  checked={removeAfterWin}
                  onChange={(e) => setRemoveAfterWin(e.target.checked)}
                >
                  Remove winner after spin
                </Checkbox>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleSpin}
                  disabled={spinning || names.length < 2}
                  className="spin-button"
                  style={{ height: '50px', fontSize: '1.2rem', marginTop: '10px' }}
                >
                  {spinning ? 'Spinning...' : 'SPIN THE WHEEL'}
                </Button>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Modal
        open={isWinnerModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        centered
        className="winner-modal"
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={5} type="secondary">
            We have a winner!
          </Title>
          <Title level={1} style={{ color: '#1890ff', margin: '10px 0 30px' }}>
            🎉 {winner} 🎉
          </Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" size="large" block onClick={handleCloseModal}>
              Close
            </Button>
            {!removeAfterWin && (
              <Button icon={<DeleteOutlined />} block onClick={handleRemoveWinner}>
                Remove {winner}
              </Button>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default WheelOfNames;
