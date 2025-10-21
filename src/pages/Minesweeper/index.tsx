import { FlagOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './styles.less';

const { Title, Text } = Typography;
const { Option } = Select;

// Types
type Cell = {
  r: number;
  c: number;
  mined: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number; // number of mines around
};

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'custom';

// Presets
const PRESETS: Record<string, { rows: number; cols: number; mines: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  advanced: { rows: 16, cols: 30, mines: 99 }, // you requested 30x30 with 16 mines but that seems inverted; using classic 16x30/99
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const MinesweeperPage: React.FC = () => {
  // --- Settings ---
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [rows, setRows] = useState<number>(9);
  const [cols, setCols] = useState<number>(9);
  const [mines, setMines] = useState<number>(10);
  const [showTips, setShowTips] = useState<boolean>(true);

  // --- Game state ---
  const [board, setBoard] = useState<Cell[][]>([]);
  const [started, setStarted] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [flagsLeft, setFlagsLeft] = useState<number>(0);
  const [timeSec, setTimeSec] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const firstClickRef = useRef<boolean>(true);

  // responsive cell size based on columns
  const cellSize = useMemo(() => {
    // for very wide boards reduce cell size
    if (cols <= 9) return 40;
    if (cols <= 16) return 32;
    if (cols <= 24) return 24;
    return 18;
  }, [cols]);

  // Apply presets when difficulty changes
  useEffect(() => {
    if (difficulty === 'custom') return;
    const p = PRESETS[difficulty];
    if (!p) return;
    setRows(p.rows);
    setCols(p.cols);
    setMines(p.mines);
  }, [difficulty]);

  // Validate custom inputs
  useEffect(() => {
    setRows((r) => clamp(r, 9, 30));
    setCols((c) => clamp(c, 9, 30));
    const maxMines = Math.max(10, Math.min(668, rows * cols - 1));
    setMines((m) => clamp(m, 10, maxMines));
  }, [rows, cols]);

  // Create empty board helper
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

  // Place mines ensuring first click safety (we will place after first click)
  const placeMines = (b: Cell[][], safeR: number, safeC: number, minesToPlace: number) => {
    const R = b.length;
    const C = b[0].length;
    const coords: [number, number][] = [];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        // exclude the safe cell and its neighbors to avoid instant loss on first click
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        coords.push([r, c]);
      }
    }
    // shuffle coords
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = coords[i];
      coords[i] = coords[j];
      coords[j] = tmp;
    }
    const chosen = coords.slice(0, minesToPlace);
    chosen.forEach(([r, c]) => (b[r][c].mined = true));

    // compute adjacent counts
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

  // Start or restart game (clears timer etc.)
  const startGame = () => {
    const R = clamp(rows, 9, 30);
    const C = clamp(cols, 9, 30);
    const maxMines = Math.max(10, Math.min(668, R * C - 1));
    const M = clamp(mines, 10, maxMines);

    setRows(R);
    setCols(C);
    setMines(M);

    clearTimer();
    firstClickRef.current = true;
    setStarted(true);
    setGameOver(false);
    setWon(false);
    setFlagsLeft(M);
    setTimeSec(0);
    const empty = createEmptyBoard(R, C);
    setBoard(empty);
    message.success('New game ready — click a cell to start (first click is safe).');
  };

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

  // Reveal logic with flood fill
  const revealCell = (r: number, c: number, bIn?: Cell[][]) => {
    if (gameOver) return;
    const b = bIn ? bIn : board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = b[r][c];
    if (!cell || cell.revealed || cell.flagged) return b;

    cell.revealed = true;

    if (cell.mined) {
      // explode — reveal all mines
      for (let rr = 0; rr < b.length; rr++)
        for (let cc = 0; cc < b[0].length; cc++) if (b[rr][cc].mined) b[rr][cc].revealed = true;
      setBoard(b);
      setGameOver(true);
      setWon(false);
      clearTimer();
      message.error('💥 Boom! You hit a mine.');
      return b;
    }

    // if zero adjacent, flood fill
    if (cell.adjacent === 0) {
      const R = b.length;
      const C = b[0].length;
      const stack: [number, number][] = [[r, c]];
      const dirs = [-1, 0, 1];
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        for (let dr of dirs)
          for (let dc of dirs) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
            const neigh = b[nr][nc];
            if (!neigh || neigh.revealed || neigh.flagged) continue;
            neigh.revealed = true;
            if (neigh.adjacent === 0 && !neigh.mined) stack.push([nr, nc]);
          }
      }
    }

    setBoard(b);
    return b;
  };

  // Check win condition after each move
  const checkWinCondition = (b: Cell[][]) => {
    const R = b.length;
    const C = b[0].length;
    // win when all non-mine cells are revealed
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        if (!b[r][c].mined && !b[r][c].revealed) return false;
      }
    return true;
  };

  // Handle left-click (reveal)
  const onLeftClick = (r: number, c: number) => {
    if (gameOver || won) return;
    // start game on first click: place mines excluding clicked cell and its neighbors
    let b = board;
    if (firstClickRef.current) {
      b = board.map((row) => row.map((cell) => ({ ...cell })));
      placeMines(b, r, c, mines);
      firstClickRef.current = false;
      startTimer();
    }

    const after = revealCell(r, c, b);
    if (!after) return;
    if (!gameOver) {
      if (checkWinCondition(after)) {
        setWon(true);
        setGameOver(true);
        clearTimer();
        setFlagsLeft((f) => Math.max(0, f));
        message.success('🎉 You cleared the board — you win!');
      }
    }
  };

  // Handle right-click (flag)
  const onRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (!started || gameOver || won) return;
    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    const cell = b[r][c];
    if (cell.revealed) return;
    if (cell.flagged) {
      cell.flagged = false;
      setFlagsLeft((f) => f + 1);
    } else {
      if (flagsLeft <= 0) {
        message.warning('No flags left');
        return;
      }
      cell.flagged = true;
      setFlagsLeft((f) => f - 1);
    }
    setBoard(b);

    if (checkWinCondition(b)) {
      setWon(true);
      setGameOver(true);
      clearTimer();
      message.success('🎉 You cleared the board — you win!');
    }
  };

  // Quick chord (left+right) to reveal neighbors when number matches flags
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
    // reveal all unflagged neighbors
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

  // Clean up timer when unmount
  useEffect(() => () => clearTimer(), []);

  // UI helpers
  const resetAll = () => {
    clearTimer();
    setStarted(false);
    setBoard([]);
    setGameOver(false);
    setWon(false);
    setFlagsLeft(0);
    setTimeSec(0);
    firstClickRef.current = true;
    message.info('Game reset. Choose settings and start.');
  };

  // Render a cell component
  const CellView: React.FC<{ cell: Cell }> = ({ cell }) => {
    const cls = ['ms-cell'];
    if (cell.revealed) cls.push('ms-revealed');
    if (cell.flagged) cls.push('ms-flagged');
    if (cell.mined && cell.revealed) cls.push('ms-mine');

    const onClick = () => onLeftClick(cell.r, cell.c);
    const onContext = (e: React.MouseEvent) => onRightClick(e, cell.r, cell.c);

    const onDouble = () => onChord(cell.r, cell.c);

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
        onContextMenu={onContext}
        onDoubleClick={onDouble}
        role="button"
        aria-label={`cell ${cell.r}-${cell.c}`}
      >
        {cell.revealed ? (
          cell.mined ? (
            '💣'
          ) : cell.adjacent > 0 ? (
            <span className={`ms-num ms-num-${cell.adjacent}`}>{cell.adjacent}</span>
          ) : (
            ''
          )
        ) : cell.flagged ? (
          <FlagOutlined />
        ) : (
          ''
        )}
      </div>
    );
  };

  return (
    <div className="ms-page">
      <Card className="ms-card" bordered={false}>
        <Title level={3}>🧩 Minesweeper</Title>

        {/* Controls */}
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={10} lg={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Text strong>Difficulty:</Text>
                <Select
                  value={difficulty}
                  onChange={(v: Difficulty) => setDifficulty(v)}
                  style={{ minWidth: 160 }}
                >
                  <Option value="beginner">Beginner (9×9, 10 mines)</Option>
                  <Option value="intermediate">Intermediate (16×16, 40 mines)</Option>
                  <Option value="advanced">Advanced (16×30, 99 mines)</Option>
                  <Option value="custom">Custom</Option>
                </Select>

                <Button icon={<ReloadOutlined />} onClick={startGame} type="primary">
                  Start / Restart
                </Button>
                <Button onClick={resetAll} danger>
                  New Setup
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Text>Rows:</Text>
                <InputNumber
                  min={9}
                  max={30}
                  value={rows}
                  onChange={(v) => setRows(v || 9)}
                  disabled={difficulty !== 'custom'}
                />
                <Text>Cols:</Text>
                <InputNumber
                  min={9}
                  max={30}
                  value={cols}
                  onChange={(v) => setCols(v || 9)}
                  disabled={difficulty !== 'custom'}
                />
                <Text>Mines:</Text>
                <InputNumber
                  min={10}
                  max={Math.max(10, Math.min(668, rows * cols - 1))}
                  value={mines}
                  onChange={(v) => setMines(v || 10)}
                  disabled={difficulty !== 'custom'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Text>Show Tips:</Text>
                <Switch checked={showTips} onChange={setShowTips} />
                <Text type="secondary">(tap cell to reveal, right-click to flag)</Text>
              </div>
            </Space>
          </Col>

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

        {/* Board area */}
        <div className="ms-board-wrap">
          <div
            className="ms-board"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gap: 6,
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
                  />
                ))}
          </div>
        </div>

        {/* Tips area */}
        {showTips && (
          <div className="ms-tips">
            <Title level={5}>Quick Tips</Title>
            <ul>
              <li>First click never hits a mine — the mines are placed after your first click.</li>
              <li>
                Right-click (or long press on mobile) to place a flag. Flags left is shown in the
                header.
              </li>
              <li>
                Double-click (or tap twice) a revealed number to chord (reveal neighbors) if flags
                match the number.
              </li>
              <li>Use custom mode to set Rows (9–30), Cols (9–30), and Mines (10–668).</li>
            </ul>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
          <div />
          <div>
            <Text type="secondary">Made with ❤️ — responsive and playable on mobile.</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MinesweeperPage;
