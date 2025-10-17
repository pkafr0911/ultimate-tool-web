import React, { useEffect, useState, useRef } from 'react';
import { Card, InputNumber, Button, Space, Typography, Switch, message } from 'antd';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

// --- Define Types ---
// Directions that the snake can move
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Represent a single grid cell with x,y coordinates
type Cell = { x: number; y: number };

const SnakeXenziaPage: React.FC = () => {
  // --- Game States ---
  const [gridSize, setGridSize] = useState<number>(20); // The board width/height (square grid)
  const [speed, setSpeed] = useState<number>(150); // How fast the snake moves (ms per move)
  const [snake, setSnake] = useState<Cell[]>([{ x: 10, y: 10 }]); // Array of snake segments
  const [direction, setDirection] = useState<Direction>('RIGHT'); // Current movement direction
  const [food, setFood] = useState<Cell>({ x: 5, y: 5 }); // Position of the food
  const [started, setStarted] = useState<boolean>(false); // Whether the game has started
  const [gameOver, setGameOver] = useState<boolean>(false); // Whether the game is over
  const [score, setScore] = useState<number>(0); // Player’s current score
  const [showConfetti, setShowConfetti] = useState<boolean>(false); // Show confetti on Game Over
  const [wallsEnabled, setWallsEnabled] = useState<boolean>(true); // Wall mode toggle (wrap-around)

  // Reference for interval timer
  const moveRef = useRef<any>(null);

  // --- Generate a random food position ---
  const randomFood = (): Cell => {
    return {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  };

  // --- Start or Restart the Game ---
  const startGame = () => {
    // Prevent too small grids
    if (gridSize < 10) {
      message.error('Grid size must be at least 10!');
      return;
    }

    // Reset all key states
    setSnake([{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }]); // Start from center
    setFood(randomFood()); // Randomize food location
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setShowConfetti(false);
    setDirection('RIGHT'); // Default direction
  };

  // --- Move Snake Each Frame ---
  const moveSnake = () => {
    // Functional setState ensures we get the latest snake value
    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] }; // Copy current head

      // Move head depending on direction
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

      // --- Handle Wall Collision or Wrap-around ---
      if (wallsEnabled) {
        // Game over if snake hits the wall
        if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
          setGameOver(true);
          return prevSnake;
        }
      } else {
        // Wrap around edges to opposite side
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;
      }

      // --- Check Self Collision ---
      // If head hits one of its body segments, end the game
      if (newSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      // Add new head to front of array
      newSnake.unshift(head);

      // --- Check if Snake Eats Food ---
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 10); // Increase score
        setFood(randomFood()); // Generate new food
      } else {
        newSnake.pop(); // Otherwise, remove tail (snake moves)
      }

      return newSnake;
    });
  };

  // --- Handle Keyboard Controls ---
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

  // --- Main Game Loop ---
  useEffect(() => {
    if (started && !gameOver) {
      // Move snake every [speed] milliseconds
      moveRef.current = setInterval(moveSnake, speed);
    }

    // Cleanup interval when direction/speed/game state changes
    return () => clearInterval(moveRef.current);
  }, [started, speed, direction, gameOver]);

  // --- Listen for Keyboard Events ---
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // --- Handle Game Over State ---
  useEffect(() => {
    if (gameOver) {
      clearInterval(moveRef.current);
      message.error('💀 Game Over!');
      setShowConfetti(true);
    }
  }, [gameOver]);

  // --- Return to Setup Mode ---
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
      {/* Show confetti on Game Over */}
      {showConfetti && gameOver && <Confetti />}

      <Card className="tic-card" bordered={false}>
        <Title level={3}>🐍 Snake Xenzia</Title>

        {/* --- Game Setup Panel --- */}
        {!started ? (
          <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
            {/* Grid size selector */}
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

            {/* Speed selector */}
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

            {/* Wall mode toggle */}
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

            {/* Start button */}
            <Button type="primary" size="large" onClick={startGame}>
              Start Game
            </Button>
          </Space>
        ) : (
          <>
            {/* --- Game Board --- */}
            <div
              className="snake-board"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 20px)`, // Create columns dynamically
                gap: 2, // Space between cells
                marginTop: 20,
                justifyContent: 'center',
              }}
            >
              {/* Render each cell in the grid */}
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
                          ? '#52c41a' // Snake head color
                          : isSnake
                            ? '#73d13d' // Snake body color
                            : isFood
                              ? '#ff7875' // Food color
                              : '#f0f0f0', // Empty cell
                        borderRadius: isFood ? '50%' : 2, // Make food circular
                      }}
                    />
                  );
                }),
              )}
            </div>

            {/* --- Game Status --- */}
            <div style={{ marginTop: 20 }}>
              {!gameOver ? (
                <Title level={4}>Score: {score}</Title>
              ) : (
                <Title level={4} style={{ color: '#ff4d4f' }}>
                  Game Over! Final Score: {score}
                </Title>
              )}
            </div>

            {/* --- Control Buttons --- */}
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
