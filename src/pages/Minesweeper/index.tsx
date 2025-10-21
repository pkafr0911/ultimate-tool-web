// --- Import React, Ant Design components, and icons ---
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import { SettingOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Radio, Row, Select, Space, Typography, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import SetupModal from './components/SetupModal';
import './styles.less'; // custom stylesheet for Minesweeper

const { Title, Text } = Typography;
const { Option } = Select;

// ========================================================
// 🧩 Types & Constants
// ========================================================

// Each cell on the board
type Cell = {
  r: number; // row index
  c: number; // column index
  mined: boolean; // whether it contains a mine
  revealed: boolean; // whether the cell has been revealed
  flagged: boolean; // whether the cell has been flagged
  adjacent: number; // number of surrounding mines
};

// Difficulty options
type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'custom';

// Predefined board sizes for each difficulty
const PRESETS: Record<string, { rows: number; cols: number; mines: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  advanced: { rows: 16, cols: 30, mines: 99 },
};

// Helper: limit value between two bounds
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const MinesweeperPage: React.FC = () => {
  // ========================================================
  // ⚙️ Settings (user-configurable)
  // ========================================================
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [rows, setRows] = useState<number>(9);
  const [cols, setCols] = useState<number>(9);
  const [mines, setMines] = useState<number>(10);
  const [showTips, setShowTips] = useState<boolean>(true);
  const [tapMode, setTapMode] = useState<'reveal' | 'flag'>('reveal'); // toggle mode for mobile taps

  // ========================================================
  // 🎮 Game State
  // ========================================================
  const [board, setBoard] = useState<Cell[][]>([]); // 2D grid of cells
  const [started, setStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [flagsLeft, setFlagsLeft] = useState<number>(0);
  const [timeSec, setTimeSec] = useState<number>(0);
  const [isSetupOpen, setIsSetupOpen] = useState(true);

  // Refs for timer and first-click detection
  const timerRef = useRef<number | null>(null);
  const firstClickRef = useRef<boolean>(true);

  const isMobile = useIsMobile(); // Check in using Mobile
  const isTouch = useIsTouchDevice(); //check  is using touch screen (mobile or tablet)

  const CELL_GAP = useMemo(() => (isMobile ? 4 : 6), [isMobile]);

  // ========================================================
  // 📱 Responsive cell size calculation
  // ========================================================
  const cellSize = useMemo(() => {
    if (isMobile) {
      if (cols <= 9) return 32;
      if (cols <= 16) return 24;
      if (cols <= 24) return 18;
      return 16;
    } else {
      if (cols <= 9) return 40;
      if (cols <= 16) return 32;
      if (cols <= 24) return 28;
      return 22;
    }
  }, [cols, isMobile]);

  // ========================================================
  // 📱 Board justify content  calculation
  // ========================================================

  const boardJustifyContent = useMemo(() => {
    const innerWidth = window.innerWidth;
    const allPadding = 40 + 16 + 24;
    const boardSize = (cellSize + CELL_GAP * 2) * cols;
    const cardSize = isMobile ? innerWidth : innerWidth - allPadding * 2;
    return boardSize > cardSize ? 'flex-start' : 'center';
  }, [cellSize, cols, isMobile]);

  // ========================================================
  // 🧭 Sync preset difficulty values
  // ========================================================
  useEffect(() => {
    if (difficulty === 'custom') return;
    const p = PRESETS[difficulty];
    if (!p) return;
    setRows(p.rows);
    setCols(p.cols);
    setMines(p.mines);
  }, [difficulty]);

  // Clamp custom values to valid ranges
  useEffect(() => {
    setRows((r) => clamp(r, 9, 30));
    setCols((c) => clamp(c, 9, 30));
    const maxMines = Math.max(10, Math.min(668, rows * cols - 1));
    setMines((m) => clamp(m, 10, maxMines));
  }, [rows, cols]);

  // ========================================================
  // 🧱 Helper: create an empty board
  // ========================================================
  const createEmptyBoard = (R: number, C: number): Cell[][] =>
    Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, (_, c) => ({
        r,
        c,
        mined: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      })),
    );

  // ========================================================
  // 💣 Place mines (after first click)
  // Ensures first click and its neighbors are always safe.
  // ========================================================
  const placeMines = (b: Cell[][], safeR: number, safeC: number, minesToPlace: number) => {
    const R = b.length;
    const C = b[0].length;
    const coords: [number, number][] = [];

    // Exclude safe cell and neighbors
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        coords.push([r, c]);
      }
    }

    // Shuffle coordinates
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    // Place mines in first N shuffled cells
    const chosen = coords.slice(0, minesToPlace);
    chosen.forEach(([r, c]) => (b[r][c].mined = true));

    // Compute numbers (adjacent mine count)
    const dirs = [-1, 0, 1];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (b[r][c].mined) {
          b[r][c].adjacent = -1;
          continue;
        }
        let count = 0;
        for (let dr of dirs)
          for (let dc of dirs) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < R && nc >= 0 && nc < C && b[nr][nc].mined) count++;
          }
        b[r][c].adjacent = count;
      }
    }
  };

  // ========================================================
  // ▶️ Start or restart game
  // ========================================================
  const startGame = () => {
    const R = clamp(rows, 9, 30);
    const C = clamp(cols, 9, 30);
    const maxMines = Math.max(10, Math.min(668, R * C - 1));
    const M = clamp(mines, 10, maxMines);

    // Apply validated values
    setRows(R);
    setCols(C);
    setMines(M);

    // Reset all runtime states
    clearTimer();
    firstClickRef.current = true;
    setStarted(true);
    setGameOver(false);
    setWon(false);
    setFlagsLeft(M);
    setTimeSec(0);
    setBoard(createEmptyBoard(R, C));
    message.success('New game ready — click a cell to start (first click is safe).');
  };

  // ========================================================
  // ⏱ Timer controls
  // ========================================================
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => setTimeSec((s) => s + 1), 1000);
  };

  // ========================================================
  // 🔍 Reveal logic (with flood fill for empty zones)
  // ========================================================
  const revealCell = (r: number, c: number, bIn?: Cell[][]) => {
    if (gameOver) return;
    const b = bIn ? bIn : board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = b[r][c];
    if (!cell || cell.revealed || cell.flagged) return b;

    cell.revealed = true;

    // 💥 Mine hit
    if (cell.mined) {
      for (let rr = 0; rr < b.length; rr++)
        for (let cc = 0; cc < b[0].length; cc++) if (b[rr][cc].mined) b[rr][cc].revealed = true;
      setBoard(b);
      setGameOver(true);
      setWon(false);
      clearTimer();
      message.error('💥 Boom! You hit a mine.');
      return b;
    }

    // 🌊 Flood fill empty area
    // If the clicked cell has 0 adjacent mines → start flood fill
    if (cell.adjacent === 0) {
      const R = b.length; // total rows
      const C = b[0].length; // total columns

      // We'll use this stack to iteratively reveal neighboring cells.
      const stack: [number, number][] = [[r, c]];

      // Directions we can move: up, down, left, right, and diagonals
      // By combining all pairs of (-1, 0, 1), we cover the 8 surrounding cells.
      const dirs = [-1, 0, 1];

      // --- Loop until there are no more cells to process ---
      while (stack.length) {
        // Take one cell from the stack (Depth-First approach)
        const [cr, cc] = stack.pop()!;

        // Check all 8 neighboring cells around the current cell
        for (let dr of dirs)
          for (let dc of dirs) {
            const nr = cr + dr; // new row index
            const nc = cc + dc; // new column index

            // Skip out-of-bounds coordinates
            if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;

            // Get neighbor cell
            const neigh = b[nr][nc];

            // Skip if the neighbor is undefined, already revealed, or flagged
            if (!neigh || neigh.revealed || neigh.flagged) continue;

            // Reveal the neighbor cell
            neigh.revealed = true;

            // If the neighbor also has 0 adjacent mines (and isn’t mined),
            // add it to the stack for further expansion
            // This ensures all connected empty areas are revealed recursively.
            if (neigh.adjacent === 0 && !neigh.mined) stack.push([nr, nc]);
          }
      }
    }

    setBoard(b);
    return b;
  };

  // ========================================================
  // 🏆 Check win condition
  // ========================================================
  const checkWinCondition = (b: Cell[][]) =>
    b.every((row) => row.every((cell) => cell.mined || cell.revealed));

  // ========================================================
  // 👆 Left click: reveal cell
  // ========================================================
  const onLeftClick = (r: number, c: number) => {
    if (gameOver || won) return;

    // On first click → place mines safely
    let b = board;
    if (firstClickRef.current) {
      b = board.map((row) => row.map((cell) => ({ ...cell })));
      placeMines(b, r, c, mines);
      firstClickRef.current = false;
      startTimer();
    }

    const after = revealCell(r, c, b);
    if (!after) return;

    if (!gameOver && checkWinCondition(after)) {
      setWon(true);
      setGameOver(true);
      clearTimer();
      setFlagsLeft((f) => Math.max(0, f));
      message.success('🎉 You cleared the board — you win!');
    }
  };

  // ========================================================
  // 🏴 Right click: toggle flag
  // ========================================================
  const onRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (!started || gameOver || won) return;
    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = b[r][c];
    if (cell.revealed) return;

    // toggle flag
    if (cell.flagged) {
      cell.flagged = false;
      setFlagsLeft((f) => f + 1);
    } else {
      if (flagsLeft <= 0) return message.warning('No flags left');
      cell.flagged = true;
      setFlagsLeft((f) => f - 1);
    }
    setBoard(b);

    // check for win after flagging
    if (checkWinCondition(b)) {
      setWon(true);
      setGameOver(true);
      clearTimer();
      message.success('🎉 You cleared the board — you win!');
    }
  };

  // ========================================================
  // ⛏️ Chording: reveal neighbors if adjacent flags match number
  // ========================================================
  const onChord = (r: number, c: number) => {
    if (gameOver || won) return;
    const cell = board[r][c];
    if (!cell || !cell.revealed || cell.adjacent <= 0) return;

    // count flagged neighbors
    const R = board.length;
    const C = board[0].length;
    let flagged = 0;
    const neighs: [number, number][] = [];

    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        neighs.push([nr, nc]);
        if (board[nr][nc].flagged) flagged++;
      }

    if (flagged !== cell.adjacent) return;

    // reveal unflagged neighbors
    let b = board.map((row) => row.map((cell) => ({ ...cell })));
    for (const [nr, nc] of neighs) {
      if (!b[nr][nc].flagged && !b[nr][nc].revealed) {
        const res = revealCell(nr, nc, b);
        b = res || b;
        if (gameOver) break;
      }
    }

    setBoard(b);
    if (!gameOver && checkWinCondition(b)) {
      setWon(true);
      setGameOver(true);
      clearTimer();
      message.success('🎉 You cleared the board — you win!');
    }
  };

  // ========================================================
  // 🧹 Reset helper
  // ========================================================
  const resetAll = () => {
    clearTimer();
    setStarted(false);
    setBoard([]);
    setGameOver(false);
    setWon(false);
    setFlagsLeft(0);
    setTimeSec(0);
    firstClickRef.current = true;
  };

  // Clear timer on unmount
  useEffect(() => () => clearTimer(), []);

  // ========================================================
  // 🎨 Render: Cell component
  // ========================================================
  const CellView: React.FC<{ cell: Cell }> = ({ cell }) => {
    const cls = ['ms-cell'];
    if (cell.revealed) cls.push('ms-revealed');
    if (cell.flagged) cls.push('ms-flagged');
    if (cell.mined && cell.revealed) cls.push('ms-mine');

    const onClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (tapMode === 'reveal') onLeftClick(cell.r, cell.c);
      else onRightClick(e, cell.r, cell.c);
    };

    return (
      <div
        className={cls.join(' ')}
        style={{
          width: cellSize,
          height: cellSize,
          lineHeight: `${cellSize}px`,
          fontSize: Math.floor(cellSize * 0.55),
        }}
        onClick={onClick}
        onContextMenu={(e) => onRightClick(e, cell.r, cell.c)}
        onDoubleClick={() => onChord(cell.r, cell.c)}
      >
        {/* Display content: mine, number, or flag */}
        {cell.revealed ? (
          cell.mined ? (
            '💣'
          ) : cell.adjacent > 0 ? (
            <span className={`ms-num ms-num-${cell.adjacent}`}>{cell.adjacent}</span>
          ) : (
            ''
          )
        ) : cell.flagged ? (
          '🚩'
        ) : (
          ''
        )}
      </div>
    );
  };

  // ========================================================
  // 🧩 Main Page Layout
  // ========================================================
  return (
    <div className="ms-page">
      {won && <Confetti />}
      <Card className="ms-card" variant={'borderless'}>
        <Space>
          <Title level={3}>💣 Minesweeper </Title>
        </Space>

        <Flex
          justify="center"
          align="center"
          style={{
            gap: 8,
            marginTop: 16,
          }}
        >
          {!started && (
            <Button style={{ width: '100%' }} type="primary" onClick={startGame}>
              Start
            </Button>
          )}
          {started && (
            <Button
              style={{ width: '100%' }}
              danger
              onClick={() => {
                resetAll();
                message.info('Game reset. Choose settings and start.');
              }}
            >
              Reset
            </Button>
          )}
          <Button onClick={() => setIsSetupOpen(true)} type="dashed" icon={<SettingOutlined />} />
        </Flex>

        {/* ----- Settings Controls ----- */}
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={10} lg={8}>
            {/* Buttons */}

            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {isTouch && (
                <>
                  {' '}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Text>Tap Mode:</Text>
                    <Radio.Group
                      value={tapMode}
                      onChange={(e) => setTapMode(e.target.value)}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="reveal">💣 Reveal</Radio.Button>
                      <Radio.Button value="flag">🚩 Flag</Radio.Button>
                    </Radio.Group>
                  </div>
                </>
              )}
            </Space>
          </Col>

          {/* ----- Game Info ----- */}
          <Col xs={24} sm={12} md={14} lg={16}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <div>
                <Text strong>Mines:</Text>
                <div>{flagsLeft}</div>
              </div>
              <div>
                <Text strong>Time:</Text>
                <div>{timeSec}s</div>
              </div>
              <div>
                <Text strong>Status:</Text>
                <div>{gameOver ? (won ? 'Won ✅' : 'Lost ❌') : started ? 'Playing' : 'Idle'}</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* ----- Game Board ----- */}
        <div
          className="ms-board-wrap"
          style={{
            justifyContent: boardJustifyContent,
          }}
        >
          <div
            className="ms-board"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gap: CELL_GAP,
              position: 'relative',
            }}
          >
            {board.length > 0
              ? board.map((row) =>
                  row.map((cell) => <CellView key={`${cell.r}-${cell.c}`} cell={cell} />),
                )
              : Array.from({ length: rows * cols }).map((_, i) => (
                  <div
                    key={i}
                    className="ms-cell"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      lineHeight: `${cellSize}px`,
                      fontSize: Math.floor(cellSize * 0.55),
                      background: '#fafafa',
                    }}
                    onClick={startGame}
                  />
                ))}
          </div>
        </div>

        {/* --- Centered "CLICK TO START" Overlay --- */}
        {!started && !gameOver && (
          <div className="ms-start-overlay" onClick={startGame}>
            CLICK TO START
          </div>
        )}
        {/* ----- Tips Section ----- */}
        {showTips && (
          <div className="ms-tips">
            <Title level={5}>Quick Tips</Title>
            <ul>
              <li>First click never hits a mine — mines are placed after your first click.</li>
              <li>Right-click (or long press) to place a flag.</li>
              <li>Double-click a number to chord if flags match.</li>
              <li>Use custom mode for full control of board size.</li>
            </ul>
          </div>
        )}

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Text type="secondary">Made with ❤️ — responsive and mobile friendly.</Text>
        </div>
      </Card>
      <SetupModal
        visible={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        rows={rows}
        setRows={setRows}
        cols={cols}
        setCols={setCols}
        mines={mines}
        setMines={setMines}
        showTips={showTips}
        setShowTips={setShowTips}
        started={started || gameOver || won}
        startGame={startGame}
        resetAll={resetAll}
      />
    </div>
  );
};

export default MinesweeperPage;
