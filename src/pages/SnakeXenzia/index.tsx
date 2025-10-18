import { Button, Card, InputNumber, Space, Switch, Typography, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

// --- Define Types ---
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Cell = { x: number; y: number };

const SnakeXenziaPage: React.FC = () => {
  // --- Game States ---
  const [gridSize, setGridSize] = useState<number>(20); // The board width/height (square grid)
  const [speed, setSpeed] = useState<number>(75); // How fast the snake moves (ms per move)
  const [snake, setSnake] = useState<Cell[]>([{ x: 10, y: 10 }]); // Array of snake segments
  const [direction, setDirection] = useState<Direction>('RIGHT'); // Current movement direction
  const [food, setFood] = useState<Cell>({ x: 5, y: 5 }); // Position of the food
  const [started, setStarted] = useState<boolean>(false); // Whether the game has started
  const [gameOver, setGameOver] = useState<boolean>(false); // Whether the game is over
  const [score, setScore] = useState<number>(0); // Player’s c urrent score
  const [showConfetti, setShowConfetti] = useState<boolean>(false); // Show confetti on Game Over
  const [wallsEnabled, setWallsEnabled] = useState<boolean>(true); // Wall mode toggle (wrap-around)

  const moveRef = useRef<any>(null);

  // --- Generate random food position ---
  const randomFood = (): Cell => ({
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize),
  });

  // --- Start or Restart the Game ---
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

  // --- Move Snake Each Frame ---
  const moveSnake = () => {
    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      // Move head based on direction
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

      // Handle walls or wrap-around
      if (wallsEnabled) {
        if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
          setGameOver(true);
          return prevSnake;
        }
      } else {
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;
      }

      // Check self-collision
      if (newSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      newSnake.unshift(head);

      // Check food
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10);
        setFood(randomFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  // --- Handle Keyboard Input ---
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!started || gameOver) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case 'arrowup':
      case 'w':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'arrowdown':
      case 's':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'arrowleft':
      case 'a':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'arrowright':
      case 'd':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
    }
  };

  // --- Manual Direction Change ---
  const handleManualMove = (dir: Direction) => {
    if (!started || gameOver) return;
    if (
      (dir === 'UP' && direction !== 'DOWN') ||
      (dir === 'DOWN' && direction !== 'UP') ||
      (dir === 'LEFT' && direction !== 'RIGHT') ||
      (dir === 'RIGHT' && direction !== 'LEFT')
    ) {
      setDirection(dir);
    }
  };

  // --- Main Game Loop ---
  useEffect(() => {
    if (started && !gameOver) {
      moveRef.current = setInterval(moveSnake, speed);
    }
    return () => clearInterval(moveRef.current);
  }, [started, speed, direction, gameOver]);

  // --- Keyboard Event Listener ---
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, direction, gameOver]);

  // --- Game Over Effect ---
  useEffect(() => {
    if (gameOver) {
      clearInterval(moveRef.current);
      message.error('💀 Game Over!');
      setShowConfetti(true);
    }
  }, [gameOver]);

  // --- Reset Setup ---
  const resetGame = () => {
    setStarted(false);
    setSnake([]);
    setScore(0);
    setGameOver(false);
    setShowConfetti(false);
  };

  // --- Render UI ---
  return (
    <div className="tic-container">
      {showConfetti && gameOver && <Confetti />}
      <Card className="tic-card" variant={'borderless'}>
        <Title level={3}>🐍 Snake Xenzia</Title>

        {!started ? (
          <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
            {/* Grid size setup */}
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

            {/* Speed setup */}
            <div>
              <Text strong>Speed (ms):</Text>
              <InputNumber
                min={10}
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
            {/* Game Board */}
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

            {/* Score */}
            <div style={{ marginTop: 20 }}>
              {!gameOver ? (
                <Title level={4}>Score: {score}</Title>
              ) : (
                <Title level={4} style={{ color: '#ff4d4f' }}>
                  Game Over! Final Score: {score}
                </Title>
              )}
            </div>

            {/* Directional Buttons */}
            <div className="manual-controls">
              <div className="control-row">
                <Button disabled={!started || gameOver} onClick={() => handleManualMove('UP')}>
                  ⬆️ / W
                </Button>
              </div>
              <div className="control-row">
                <Button disabled={!started || gameOver} onClick={() => handleManualMove('LEFT')}>
                  ⬅️ / A
                </Button>
                <Button disabled={!started || gameOver} onClick={() => handleManualMove('DOWN')}>
                  ⬇️ / S
                </Button>
                <Button disabled={!started || gameOver} onClick={() => handleManualMove('RIGHT')}>
                  ➡️ / D
                </Button>
              </div>
            </div>

            {/* Control Buttons */}
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
