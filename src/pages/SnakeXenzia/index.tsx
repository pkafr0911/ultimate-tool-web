import { Button, Card, InputNumber, Space, Switch, Typography, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

// --- Define basic types ---
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Cell = { x: number; y: number };

const SnakeXenziaPage: React.FC = () => {
  // --- Game configuration states ---
  const [gridSize, setGridSize] = useState<number>(20); // Board size (number of rows/columns)
  const [speed, setSpeed] = useState<number>(75); // Snake speed in milliseconds per move
  const [snake, setSnake] = useState<Cell[]>([{ x: 10, y: 10 }]); // Array of cells (snake body)
  const [direction, setDirection] = useState<Direction>('RIGHT'); // Snake’s current direction
  const [food, setFood] = useState<Cell>({ x: 5, y: 5 }); // Position of the food
  const [started, setStarted] = useState<boolean>(false); // Whether the game has started
  const [gameOver, setGameOver] = useState<boolean>(false); // Whether the player lost
  const [score, setScore] = useState<number>(0); // Player’s score
  const [showConfetti, setShowConfetti] = useState<boolean>(false); // Confetti animation toggle
  const [wallsEnabled, setWallsEnabled] = useState<boolean>(true); // Whether hitting walls ends the game

  // A ref to hold the movement interval ID (so we can clear it later)
  const moveRef = useRef<any>(null);

  // --- Refs for swipe gesture tracking ---
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // --- Generate a random food position within grid ---
  const randomFood = (): Cell => ({
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize),
  });

  // --- Start or restart the game ---
  const startGame = () => {
    if (gridSize < 10) {
      message.error('Grid size must be at least 10!');
      return;
    }

    // Reset all gameplay-related states
    setSnake([{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }]); // Start from center
    setFood(randomFood()); // Place food randomly
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setShowConfetti(false);
    setDirection('RIGHT');
  };

  // --- Core snake movement logic ---
  const moveSnake = () => {
    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] }; // Copy the snake’s head

      // Move head in the current direction
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

      // --- Wall collision or wrap-around logic ---
      if (wallsEnabled) {
        // If walls are active, hitting the edge ends the game
        if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
          setGameOver(true);
          return prevSnake;
        }
      } else {
        // Otherwise, snake wraps around edges
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;
      }

      // --- Check self-collision ---
      if (newSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      // Move head to front of snake array
      newSnake.unshift(head);

      // --- Check if snake eats food ---
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10); // Add score
        setFood(randomFood()); // Generate new food
      } else {
        newSnake.pop(); // Otherwise remove tail segment
      }

      return newSnake;
    });
  };

  // --- Keyboard input for movement (desktop controls) ---
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

  // --- Touch event handlers for mobile swipe control ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!started || gameOver) return;

    const dx = touchEndX.current - touchStartX.current;
    const dy = touchEndY.current - touchStartY.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 30 && direction !== 'LEFT') setDirection('RIGHT');
      else if (dx < -30 && direction !== 'RIGHT') setDirection('LEFT');
    } else {
      // Vertical swipe
      if (dy > 30 && direction !== 'UP') setDirection('DOWN');
      else if (dy < -30 && direction !== 'DOWN') setDirection('UP');
    }
  };

  // --- Disable scrolling and page swiping on mobile while playing ---
  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const preventScroll = (e: TouchEvent) => e.preventDefault();

    if (isMobile && started && !gameOver) {
      // Fully block scroll gestures
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed'; // Prevent bounce on iOS
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';

      // Attach early (non-passive) listener to cancel all scrolling
      window.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      // Restore normal
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.removeEventListener('touchmove', preventScroll);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [started, gameOver]);

  // --- Manual directional button control (optional UI buttons) ---
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

  // --- Main game loop: move the snake at set intervals ---
  useEffect(() => {
    if (started && !gameOver) {
      moveRef.current = setInterval(moveSnake, speed);
    }
    return () => clearInterval(moveRef.current);
  }, [started, speed, direction, gameOver]);

  // --- Attach keyboard event listener ---
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, direction, gameOver]);

  // --- Game over visual effects ---
  useEffect(() => {
    if (gameOver) {
      clearInterval(moveRef.current);
      message.error('💀 Game Over!');
      setShowConfetti(true);
    }
  }, [gameOver]);

  // --- Reset entire setup (return to setup screen) ---
  const resetGame = () => {
    setStarted(false);
    setSnake([]);
    setScore(0);
    setGameOver(false);
    setShowConfetti(false);
  };

  // --- UI Render Section ---
  return (
    <div
      className="tic-container"
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => {
        e.preventDefault(); // Prevent swipe scroll within game only
        handleTouchMove(e);
      }}
      onTouchEnd={handleTouchEnd}
    >
      {/* Show confetti when player loses */}
      {showConfetti && gameOver && <Confetti />}

      <Card className="tic-card" variant={'borderless'}>
        <Title level={3}>🐍 Snake Xenzia</Title>

        {/* --- Setup UI (before starting) --- */}
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

            {/* Wall mode setup */}
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
            {/* --- Main Game Board --- */}
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
              {/* Render grid cells */}
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
                          ? '#52c41a' // Head color
                          : isSnake
                          ? '#73d13d' // Body color
                          : isFood
                          ? '#ff7875' // Food color
                          : '#f0f0f0', // Empty cell color
                        borderRadius: isFood ? '50%' : 2,
                      }}
                    />
                  );
                }),
              )}
            </div>

            {/* --- Score Display --- */}
            <div style={{ marginTop: 20 }}>
              {!gameOver ? (
                <Title level={4}>Score: {score}</Title>
              ) : (
                <Title level={4} style={{ color: '#ff4d4f' }}>
                  Game Over! Final Score: {score}
                </Title>
              )}
            </div>

            {/* --- Optional manual direction buttons (useful for testing) --- */}
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

            {/* --- Game control buttons --- */}
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
