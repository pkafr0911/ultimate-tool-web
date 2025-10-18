import { Button, Card, Input, message, Space, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title } = Typography;
const colors: string[] = ['#ff7875', '#ffa940', '#ffd666', '#95de64', '#69c0ff', '#b37feb'];

const WheelOfNames: React.FC = () => {
  const [nameInput, setNameInput] = useState<string>('Alice\nBob\nCharlie\nDavid');
  const [names, setNames] = useState<string[]>(
    nameInput.split('\n').filter((n) => n.trim() !== ''),
  );
  const [rotation, setRotation] = useState<number>(0);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setNames(nameInput.split('\n').filter((n) => n.trim() !== ''));
  }, [nameInput]);

  useEffect(() => {
    drawWheel(rotation);
  }, [names, rotation]);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = names.length;
    const arc = (2 * Math.PI) / total;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);

    names.forEach((name, i) => {
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, canvas.width / 2, i * arc, (i + 1) * arc);
      ctx.fill();

      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 20px sans-serif`;
      ctx.translate(
        Math.cos(i * arc + arc / 2) * (canvas.width / 3),
        Math.sin(i * arc + arc / 2) * (canvas.height / 3),
      );
      ctx.rotate(i * arc + arc / 2);
      ctx.fillText(name, -ctx.measureText(name).width / 2, 5);
      ctx.restore();
    });

    if (!spinning) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Click to Spin', -ctx.measureText('Click to Spin').width / 2, 10);
    }

    ctx.restore();
  };

  const handleSpin = () => {
    if (names.length < 2) {
      message.error('Add at least two names!');
      return;
    }

    setWinner(null);
    setSpinning(true);
    const newRotation = rotation + 360 * 5 + Math.floor(Math.random() * 360);
    animateSpin(rotation, newRotation, 4000);
  };

  const animateSpin = (start: number, end: number, duration: number) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setRotation(start + (end - start) * easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const normalized = ((end % 360) + 360) % 360;
        const segment = 360 / names.length;
        const winnerIndex = Math.floor((360 - normalized) / segment) % names.length;
        setWinner(names[winnerIndex]);
        setSpinning(false);
        message.success(`Winner: ${names[winnerIndex]}`);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 15000);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="wheel-light-container">
      {showConfetti && <Confetti />}
      <Card className="wheel-light-card" variant={'borderless'}>
        <Title level={3} className="wheel-light-title">
          🎡 Wheel of Names
        </Title>
        <div className="wheel-light-content">
          <div className="wheel-light-canvas">
            <canvas
              ref={canvasRef}
              width={450}
              height={450}
              onClick={handleSpin}
              style={{ cursor: 'pointer' }}
            />
            <div className="wheel-light-pointer" />
          </div>

          <div className="wheel-light-controls">
            <Button
              type="primary"
              size="large"
              className="spin-btn-light"
              onClick={handleSpin}
              disabled={spinning}
            >
              Spin the Wheel
            </Button>

            {winner && (
              <Title level={4} style={{ color: '#52c41a', marginTop: 10 }}>
                Winner: {winner}
              </Title>
            )}

            <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
              <Input.TextArea
                rows={10}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter names, each on a new line"
              />
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WheelOfNames;
