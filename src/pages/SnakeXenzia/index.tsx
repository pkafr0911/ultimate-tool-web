import React, { useEffect, useState, useRef } from 'react';
import { Card, InputNumber, Button, Space, Typography, Switch, message } from 'antd';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

// --- Types ---
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Cell = { x: number; y: number };

const SnakeXenziaPage: React.FC = () => {
  // --- Game States ---
  const [gridSize, setGridSize] = useState<number>(20);
  const [speed, setSpeed] = useState<number>(150); // ms per move
  const [snake, setSnake] = useState<Cell[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [food, setFood] = useState<Cell>({ x: 5, y: 5 });
  const [started, setStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [wallsEnabled, setWallsEnabled] = useState<boolean>(true);

  const moveRef = useRef<any>(null);

  // --- Generate random food position ---
  const randomFood = (): Cell => {
    return {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  };

  // --- Start Game ---
  const startGame = () => {
    if (gridSize < 10) {
      message.error('Grid size must be at least 10!');
      return;
    }
    setSnake([{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }]);
    setFood(randomFood());
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setShowConfetti(false);
    setDirection('RIGHT');
  };

  // --- Move Snake Logic ---
  const moveSnake = () => {
    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      // Move head
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Handle walls
      if (wallsEnabled) {
        if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
          setGameOver(true);
          return prevSnake;
        }
      } else {
        // wrap around
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;
      }

      // Collision with itself
      if (newSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      // Add new head
      newSnake.unshift(head);

      // Check if eating food
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10);
        setFood(randomFood());
      } else {
        newSnake.pop(); // remove tail
      }

      return newSnake;
    });
  };

  // --- Handle Keyboard Input ---
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!started || gameOver) return;
    switch (e.key) {
      case 'ArrowUp':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    if (started && !gameOver) {
      moveRef.current = setInterval(moveSnake, speed);
    }
    return () => clearInterval(moveRef.current);
  }, [started, speed, direction, gameOver]);

  // --- Keyboard listener ---
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // --- Game Over Handler ---
  useEffect(() => {
    if (gameOver) {
      clearInterval(moveRef.current);
      message.error('💀 Game Over!');
      setShowConfetti(true);
    }
  }, [gameOver]);

  // --- Reset Game ---
  const resetGame = () => {
    setStarted(false);
    setSnake([]);
    setScore(0);
    setGameOver(false);
    setShowConfetti(false);
  };

  // --- Render ---
  return (
    <div className="tic-container">
      {showConfetti && gameOver && <Confetti />}

      <Card className="tic-card" bordered={false}>
        <Title level={3}>🐍 Snake Xenzia</Title>

        {!started ? (
          <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
            {/* Grid size */}
            <div>
              <Text strong>Grid Size:</Text>
              <InputNumber
                min={10}
                max={50}
                value={gridSize}
                onChange={(val) => setGridSize(val || 20)}
                style={{ marginLeft: 10 }}
              />
            </div>

            {/* Speed */}
            <div>
              <Text strong>Speed (ms):</Text>
              <InputNumber
                min={50}
                max={500}
                step={10}
                value={speed}
                onChange={(val) => setSpeed(val || 150)}
                style={{ marginLeft: 10 }}
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                (Lower = faster)
              </Text>
            </div>

            {/* Wall mode */}
            <div>
              <Text strong>Walls Enabled:</Text>
              <Switch
                checked={wallsEnabled}
                onChange={setWallsEnabled}
                style={{ marginLeft: 10 }}
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {wallsEnabled ? 'Hit wall = Game over' : 'Wrap around mode'}
              </Text>
            </div>

            <Button type="primary" size="large" onClick={startGame}>
              Start Game
            </Button>
          </Space>
        ) : (
          <>
            {/* Board */}
            <div
              className="snake-board"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 20px)`,
                gap: 2,
                marginTop: 20,
                justifyContent: 'center',
              }}
            >
              {Array.from({ length: gridSize }).map((_, rowIdx) =>
                Array.from({ length: gridSize }).map((_, colIdx) => {
                  const isSnake = snake.some((s) => s.x === colIdx && s.y === rowIdx);
                  const isHead = snake.length && snake[0].x === colIdx && snake[0].y === rowIdx;
                  const isFood = food.x === colIdx && food.y === rowIdx;
                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className="snake-cell"
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: isHead
                          ? '#52c41a'
                          : isSnake
                            ? '#73d13d'
                            : isFood
                              ? '#ff7875'
                              : '#f0f0f0',
                        borderRadius: isFood ? '50%' : 2,
                      }}
                    />
                  );
                }),
              )}
            </div>

            {/* Status */}
            <div style={{ marginTop: 20 }}>
              {!gameOver ? (
                <Title level={4}>Score: {score}</Title>
              ) : (
                <Title level={4} style={{ color: '#ff4d4f' }}>
                  Game Over! Final Score: {score}
                </Title>
              )}
            </div>

            {/* Buttons */}
            <Space style={{ marginTop: 16 }}>
              <Button onClick={startGame}>Restart</Button>
              <Button danger onClick={resetGame}>
                New Setup
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default SnakeXenziaPage;
