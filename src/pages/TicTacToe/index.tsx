import { Button, Card, InputNumber, Space, Switch, Typography, message } from 'antd';
import React, { useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;

// Define possible cell values in the board: X, O, or null
type CellValue = 'X' | 'O' | null;

const TicTacToePage: React.FC = () => {
  // --- Game State ---
  const [boardSize, setBoardSize] = useState<number>(3); // size of the board (e.g. 3x3 or 10x10)
  const [board, setBoard] = useState<CellValue[][]>([]); // 2D array storing current board cells
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X'); // current turn: X or O
  const [winner, setWinner] = useState<string | null>(null); // track winner (X, O, or Draw)
  const [started, setStarted] = useState<boolean>(false); // true when game has started
  const [blockBothSides, setBlockBothSides] = useState<boolean>(false); // rule for large boards
  const [showConfetti, setShowConfetti] = useState<boolean>(false); // show confetti animation when someone wins

  // --- Determine win length ---
  // For 3x3: need 3 in a row to win
  // For board ≥10: need 5 in a row to win
  const getWinLength = () => (boardSize === 3 ? 3 : 5);

  // --- Initialize / Start Game ---
  const startGame = () => {
    // Validate board size (must be 3 or ≥10)
    if (boardSize !== 3 && boardSize < 10) {
      message.error('Board size must be 3 or at least 10!');
      return;
    }

    // Create an empty board filled with null
    const newBoard = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null));

    // Reset states
    setBoard(newBoard);
    setWinner(null);
    setCurrentPlayer('X');
    setStarted(true);
    setShowConfetti(false);

    // Disable "block both sides" rule if size < 10
    if (boardSize < 10) setBlockBothSides(false);
  };

  // --- Check if player has won ---
  const checkWin = (b: CellValue[][], player: 'X' | 'O'): boolean => {
    const size = b.length;
    const winLength = getWinLength();

    // Helper: Check one direction (vertical, horizontal, or diagonal)
    const checkDirection = (r: number, c: number, dr: number, dc: number): boolean => {
      let count = 0;
      let beforeBlocked = false;
      let afterBlocked = false;

      // Check consecutive cells
      for (let i = 0; i < winLength; i++) {
        const nr = r + i * dr; // row step
        const nc = c + i * dc; // column step
        // Out of bounds or not player's mark → not a win
        if (nr < 0 || nc < 0 || nr >= size || nc >= size || b[nr][nc] !== player) return false;
        count++;
      }

      // If using "block both sides" rule (for board ≥10),
      // check if both ends are blocked by opponent or edges
      if (blockBothSides && size >= 10) {
        const beforeR = r - dr;
        const beforeC = c - dc;
        const afterR = r + winLength * dr;
        const afterC = c + winLength * dc;

        beforeBlocked =
          beforeR >= 0 &&
          beforeR < size &&
          beforeC >= 0 &&
          beforeC < size &&
          b[beforeR][beforeC] !== null &&
          b[beforeR][beforeC] !== player;
        afterBlocked =
          afterR >= 0 &&
          afterR < size &&
          afterC >= 0 &&
          afterC < size &&
          b[afterR][afterC] !== null &&
          b[afterR][afterC] !== player;
      }

      // Return true if there’s a winning sequence
      // and not blocked on both ends (if rule applies)
      return count === winLength && (!blockBothSides || !(beforeBlocked && afterBlocked));
    };

    // Scan all cells and all directions for a winning pattern
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (b[r][c] !== player) continue;

        if (
          checkDirection(r, c, 1, 0) || // vertical
          checkDirection(r, c, 0, 1) || // horizontal
          checkDirection(r, c, 1, 1) || // diagonal ↘
          checkDirection(r, c, 1, -1) // diagonal ↙
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // --- Handle cell click ---
  const handleClick = (r: number, c: number) => {
    // Ignore click if game not started or already won
    if (winner || !started) return;

    // Prevent overwriting occupied cell
    if (board[r][c]) {
      message.warning('Cell already taken!');
      return;
    }

    // Clone board and mark current cell
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = currentPlayer;
    setBoard(newBoard);

    // Check win condition
    if (checkWin(newBoard, currentPlayer)) {
      setWinner(currentPlayer);
      setShowConfetti(true);
      message.success(`🎉 Player ${currentPlayer} wins!`);
      return;
    }

    // Check draw (all cells filled)
    const isDraw = newBoard.flat().every((cell) => cell);
    if (isDraw) {
      setWinner('Draw');
      message.info("It's a draw!");
      return;
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  // --- Reset entire game to setup state ---
  const resetGame = () => {
    setStarted(false);
    setBoard([]);
    setWinner(null);
    setCurrentPlayer('X');
  };

  // --- Render UI ---
  return (
    <div className="tic-container">
      {/* Show confetti when a player wins */}
      {showConfetti && winner && winner !== 'Draw' && <Confetti />}

      <Card className="tic-card" variant={'borderless'}>
        <Title level={3}>🎯 Tic-Tac-Toe</Title>

        {/* Game setup panel */}
        {!started ? (
          <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
            {/* Board size input */}
            <div>
              <Text strong>Board Size:</Text>
              <InputNumber
                min={3}
                max={100}
                step={1}
                value={boardSize}
                onChange={(val) => setBoardSize(val || 3)}
                style={{ marginLeft: 10 }}
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                (Must be 3 or ≥10)
              </Text>
            </div>

            {/* Show win condition text */}
            <div>
              <Text strong>Win Condition:</Text>
              <Text style={{ marginLeft: 10 }}>
                {boardSize === 3 ? 'Reach 3 in a row' : 'Reach 5 in a row'}
              </Text>
            </div>

            {/* Block rule toggle (only for large boards) */}
            <div>
              <Text strong>Block Both Sides Rule:</Text>
              <Switch
                checked={blockBothSides}
                disabled={boardSize < 10}
                onChange={setBlockBothSides}
                style={{ marginLeft: 10 }}
              />
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {boardSize < 10
                  ? 'Only available for board ≥10'
                  : blockBothSides
                    ? 'Enabled'
                    : 'Disabled'}
              </Text>
            </div>

            {/* Start button */}
            <Button type="primary" size="large" onClick={startGame}>
              Start Game
            </Button>
          </Space>
        ) : (
          <>
            {/* Board rendering */}
            {/* Board rendering */}
            <div
              className="tic-board"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${boardSize}, auto)`,
                ['--board-size' as any]: boardSize, // 👈 dynamic CSS var for scaling
                gap: 4,
                marginTop: 20,
                justifyContent: 'center',
              }}
            >
              {board.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <Button
                    key={`${rIdx}-${cIdx}`}
                    className="tic-cell"
                    onClick={() => handleClick(rIdx, cIdx)}
                    style={{
                      color: cell === 'X' ? '#ff7875' : '#69c0ff',
                    }}
                  >
                    {cell}
                  </Button>
                )),
              )}
            </div>

            {/* Game status */}
            <div style={{ marginTop: 20 }}>
              {!winner ? (
                <Title level={4}>Next Player: {currentPlayer}</Title>
              ) : (
                <Title level={4} style={{ color: winner === 'Draw' ? '#999' : '#52c41a' }}>
                  {winner === 'Draw' ? 'Draw!' : `Winner: ${winner}`}
                </Title>
              )}
            </div>

            {/* Game control buttons */}
            <Space style={{ marginTop: 16 }}>
              <Button onClick={startGame}>Restart</Button>
              <Button danger onClick={resetGame}>
                New Game Setup
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default TicTacToePage;
