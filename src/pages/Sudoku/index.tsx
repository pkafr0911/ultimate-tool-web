import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import {
  AimOutlined,
  CheckOutlined,
  DeleteOutlined,
  RedoOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, message, Row, Select, Space, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import './styles.less';

const { Title, Text } = Typography;
const { Option } = Select;

// --------------------------
// Types
// --------------------------

type Cell = {
  r: number;
  c: number;
  value: number | null; // user or clue value
  given: boolean; // originally provided by puzzle
  notes: Set<number>; // pencil marks
  wrong?: boolean; // flagged by validator
};

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// --------------------------
// Utilities: sudoku solver / generator (backtracking)
// --------------------------

// Deep-clone a Sudoku grid (2D array of Cell objects)
const cloneGrid = (g: Cell[][]) =>
  g.map((row) => row.map((c) => ({ ...c, notes: new Set([...c.notes]) }))); // clone each Cell and copy its notes set

// Convert Cell grid → 9x9 number matrix (empty = 0)
const cellGridToNumbers = (g: Cell[][]) => g.map((r) => r.map((c) => c.value ?? 0));

// Convert number matrix → Cell grid (optionally apply givensMask)
const numbersToCellGrid = (nums: number[][], givensMask?: boolean[][]) =>
  nums.map((row, r) =>
    row.map((val, c) => ({
      r, // row index
      c, // column index
      value: val === 0 ? null : val, // null for blanks, else number
      given: givensMask ? !!givensMask[r][c] : val !== 0, // mark as given if mask true or value present
      notes: new Set<number>(), // initialize empty notes set
    })),
  );

// Check if placing value v at row r, col c is valid
const isSafe = (mat: number[][], r: number, c: number, v: number) => {
  // check row and column
  for (let i = 0; i < 9; i++) if (mat[r][i] === v || mat[i][c] === v) return false;
  // compute top-left of 3x3 block
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  // check 3x3 block
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) if (mat[br + i][bc + j] === v) return false;
  return true; // safe placement
};

// Solve Sudoku with backtracking
const solveSudoku = (matIn: number[][]): number[][] | null => {
  const mat = matIn.map((r) => r.slice()); // copy matrix
  const emptyPos: [number, number][] = []; // store empty cell positions

  // collect empty cells
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) if (mat[r][c] === 0) emptyPos.push([r, c]);

  // recursive solver
  const backtrack = (idx: number): boolean => {
    if (idx >= emptyPos.length) return true; // all cells filled
    const [r, c] = emptyPos[idx];
    for (let v = 1; v <= 9; v++) {
      if (!isSafe(mat, r, c, v)) continue; // skip invalid
      mat[r][c] = v; // place value
      if (backtrack(idx + 1)) return true; // recurse next
      mat[r][c] = 0; // undo (backtrack)
    }
    return false;
  };

  if (backtrack(0)) return mat; // solved → return grid
  return null; // unsolvable
};

// Generate a fully solved board randomly
const generateSolvedBoard = (): number[][] => {
  const mat = Array.from({ length: 9 }, () => Array(9).fill(0)); // empty 9x9

  // recursive fill with randomized order
  const backtrack = (pos = 0): boolean => {
    if (pos === 81) return true; // all filled
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5); // shuffle numbers
    for (const n of nums) {
      if (!isSafe(mat, r, c, n)) continue;
      mat[r][c] = n;
      if (backtrack(pos + 1)) return true; // next cell
      mat[r][c] = 0; // undo
    }
    return false;
  };

  backtrack(0);
  return mat;
};

// Create a playable puzzle from a solved board
const makePuzzle = (
  solved: number[][],
  difficulty: Difficulty,
): { puzzle: number[][]; givensMask: boolean[][] } => {
  // target number of givens based on difficulty
  const targets: Record<Difficulty, number> = {
    easy: 36,
    medium: 32,
    hard: 28,
    expert: 24,
  };
  const targetGivens = targets[difficulty] ?? 32; // default 32 givens

  const puzzle = solved.map((r) => r.slice()); // copy solved grid
  const givensMask = Array.from({ length: 9 }, () => Array(9).fill(true)); // track fixed cells

  // shuffle all cell indices 0–80
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);

  // randomly remove numbers while keeping unique solvability
  for (const idx of cells) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    if (!givensMask[r][c]) continue; // already removed

    const backup = puzzle[r][c]; // store old value
    puzzle[r][c] = 0; // remove
    givensMask[r][c] = false; // mark empty

    const solvedAttempt = solveSudoku(puzzle); // try to solve after removal

    if (!solvedAttempt) {
      // revert if puzzle unsolvable
      puzzle[r][c] = backup;
      givensMask[r][c] = true;
    } else {
      // stop if we’ve reached desired givens count
      const givensCount = givensMask.flat().filter(Boolean).length;
      if (givensCount <= targetGivens) break;
    }
  }

  return { puzzle, givensMask };
};

// --------------------------
// Component
// --------------------------

const SudokuPage: React.FC = () => {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [grid, setGrid] = useState<Cell[][]>(() =>
    numbersToCellGrid(Array.from({ length: 9 }, () => Array(9).fill(0))),
  );
  const [started, setStarted] = useState(false);
  const [timeSec, setTimeSec] = useState(0);
  const [timerRef, setTimerRef] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const historyRef = useRef<Cell[][][]>([]);
  const futureRef = useRef<Cell[][][]>([]);

  // Start a new puzzle
  const startNew = (diff = difficulty) => {
    clearTimer();
    const solved = generateSolvedBoard();
    const { puzzle, givensMask } = makePuzzle(solved, diff);
    setSolution(solved);
    setGrid(numbersToCellGrid(puzzle, givensMask));
    setDifficulty(diff);
    setStarted(true);
    setTimeSec(0);
    setShowConfetti(false);
    historyRef.current = [];
    futureRef.current = [];
    message.success('New Sudoku ready — good luck!');
    startTimer();
  };

  useEffect(() => {
    // start first puzzle automatically
    startNew(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer helpers
  const clearTimer = () => {
    if (timerRef) {
      window.clearInterval(timerRef);
      setTimerRef(null);
    }
  };
  const startTimer = () => {
    if (timerRef) return;
    const id = window.setInterval(() => setTimeSec((t) => t + 1), 1000);
    setTimerRef(id);
  };

  useEffect(() => () => clearTimer(), []);

  // Helpers: history for undo/redo
  const pushHistory = (g: Cell[][]) => {
    historyRef.current.push(cloneGrid(g));
    if (historyRef.current.length > 200) historyRef.current.shift();
    futureRef.current = [];
  };

  const undo = () => {
    const h = historyRef.current;
    if (!h.length) return message.info('Nothing to undo');
    const last = h.pop()!;
    futureRef.current.push(cloneGrid(grid));
    setGrid(last);
  };

  const redo = () => {
    const f = futureRef.current;
    if (!f.length) return message.info('Nothing to redo');
    const next = f.pop()!;
    historyRef.current.push(cloneGrid(grid));
    setGrid(next);
  };

  // Validate board and mark wrong cells
  const validateBoard = (g: Cell[][]) => {
    const mat = cellGridToNumbers(g);
    const wrongSet = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = mat[r][c];
        if (v === 0) continue;
        // Temporarily clear to check duplicates
        mat[r][c] = 0;
        if (!isSafe(mat, r, c, v)) wrongSet.add(`${r},${c}`);
        mat[r][c] = v;
      }
    }

    const newGrid = cloneGrid(g);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) newGrid[r][c].wrong = wrongSet.has(`${r},${c}`);
    setGrid(newGrid);
    if (wrongSet.size) message.error(`Found ${wrongSet.size} mistake(s)`);
    else message.success('No obvious mistakes found');
  };

  // Fill a hint (one correct cell)
  const hint = () => {
    if (!solution) return message.error('No solution available');
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (!grid[r][c].value) emptyCells.push([r, c]);
    if (!emptyCells.length) return message.info('Board already complete');
    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    pushHistory(grid);
    const g = cloneGrid(grid);
    g[r][c].value = solution[r][c];
    g[r][c].notes.clear();
    setGrid(g);
    futureRef.current = [];
  };

  // Solve entire board (fill with solution)
  const solveAll = () => {
    if (!solution) return message.error('No solution available');
    pushHistory(grid);
    setGrid(
      numbersToCellGrid(
        solution,
        Array.from({ length: 9 }, () => Array(9).fill(true)),
      ),
    );
    clearTimer();
    setShowConfetti(true);
    message.success('Solved (cheater mode)');
  };

  // On number input (from palette or keyboard)
  const setNumberAt = (r: number, c: number, v: number | null) => {
    const cell = grid[r][c];
    if (cell.given) return;
    pushHistory(grid);
    const g = cloneGrid(grid);
    const target = g[r][c];
    if (v === null) {
      target.value = null;
      target.notes.clear();
    } else if (notesMode) {
      // toggle note
      if (target.notes.has(v)) target.notes.delete(v);
      else target.notes.add(v);
    } else {
      target.value = v;
      target.notes.clear();
    }

    // After each input, check win
    setGrid(g);
    futureRef.current = [];

    // quick win check
    const mat = cellGridToNumbers(g);
    if (mat.every((r) => r.every((c) => c !== 0))) {
      // validate against solution
      if (solution) {
        const correct = mat.every((rr, ri) => rr.every((cc, ci) => cc === solution[ri][ci]));
        if (correct) {
          clearTimer();
          setShowConfetti(true);
          message.success('🎉 Puzzle solved — congratulations!');
        } else {
          validateBoard(g);
        }
      }
    }
  };

  // Keyboard handling
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (e.key >= '1' && e.key <= '9') {
        setNumberAt(r, c, Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setNumberAt(r, c, null);
      } else if (e.key === 'n') {
        setNotesMode((s) => !s);
        message.info(`Notes mode ${!notesMode ? 'on' : 'off'}`);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, notesMode, grid, solution]);

  // Small helpers for rendering
  const cellClass = (cell: Cell) => {
    const cls = ['sud-cell'];
    if (cell.given) cls.push('sud-given');
    if (cell.value && !cell.given) cls.push('sud-user');
    if (cell.wrong) cls.push('sud-wrong');
    return cls.join(' ');
  };

  // UI: render notes inside a cell
  const renderNotes = (cell: Cell, size = 24) => {
    const notes = Array.from(cell.notes).sort((a, b) => a - b);
    if (!notes.length) return null;
    const perRow = 3;
    const fontSize = Math.max(8, Math.floor(size / 4));
    return (
      <div className="sud-notes" style={{ fontSize }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="sud-note-slot">
            {cell.notes.has(i + 1) ? i + 1 : ''}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="sud-page">
      {showConfetti && <Confetti />}
      <Card className="sud-card" bordered={false}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>🧩 Sudoku</Title>

            {/* --- Game Description --- */}
            <Text
              type="secondary"
              style={{
                display: 'block',
                marginTop: 8,
                maxWidth: 640,
                lineHeight: 1.6,
              }}
            >
              Sudoku is a logic-based, combinatorial number-placement puzzle. In classic Sudoku, the
              objective is to fill a 9 × 9 grid with digits so that each column, each row, and each
              of the nine 3 × 3 subgrids that compose the grid contains all of the digits from 1 to
              9.
            </Text>
            <Text type="secondary">Responsive, notes, hints, undo/redo, and solver.</Text>
          </Col>

          <Col>
            <Space wrap>
              <Text>Difficulty</Text>
              <Select value={difficulty} onChange={(val) => setDifficulty(val as Difficulty)}>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
                <Option value="expert">Expert</Option>
              </Select>

              <Button onClick={() => startNew(difficulty)} type="primary">
                New
              </Button>

              <Button onClick={() => undo()} icon={<UndoOutlined />} />
              <Button onClick={() => redo()} icon={<RedoOutlined />} />

              <Button onClick={() => validateBoard(grid)} icon={<CheckOutlined />} />
              <Button onClick={() => hint()} icon={<AimOutlined />} />
              <Button onClick={() => solveAll()} danger>
                Solve
              </Button>
            </Space>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'flex-start',
            gap: 16,
          }}
        >
          <div className="sud-layout">
            <div className="sud-grid">
              {/* Sudoku grid */}
              <div style={{ minWidth: 340 }}>
                <div className="sud-grid" role="grid" aria-label="Sudoku board">
                  {grid.map((row, r) => (
                    <div key={r} className="sud-row">
                      {row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          role="gridcell"
                          tabIndex={0}
                          className={`${cellClass(cell)} ${
                            selected && selected[0] === r && selected[1] === c ? 'sud-selected' : ''
                          }`}
                          onClick={() => setSelected([r, c])}
                          onDoubleClick={() => setSelected([r, c])}
                        >
                          {cell.value ? (
                            <div className="sud-val">{cell.value}</div>
                          ) : (
                            <div className="sud-empty">{renderNotes(cell)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text strong>Time:</Text> <Text>{timeSec}s</Text>
                  </div>

                  <div>
                    <Space>
                      <Button onClick={() => setNotesMode((s) => !s)}>
                        {notesMode ? 'Notes: ON' : 'Notes: OFF'}
                      </Button>
                      <Button
                        onClick={() => setNumberAt(selected?.[0] ?? 0, selected?.[1] ?? 0, null)}
                        icon={<DeleteOutlined />}
                      >
                        Erase
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            </div>

            <div className="sud-number-wrap">
              {/* Number palette */}
              <div className="sud-number-palette">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    onClick={() => {
                      if (!selected) return message.info('Select a cell first');
                      setNumberAt(selected[0], selected[1], n);
                    }}
                  >
                    {n}
                  </Button>
                ))}
              </div>

              <div className="sud-control-buttons">
                <Button onClick={() => hint()}>Hint</Button>
                <Button onClick={() => validateBoard(grid)}>Validate</Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- How to Play Guide --- */}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Title level={4}>🧠 How to Play</Title>
          <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
            <li>Click any empty cell to select it.</li>
            <li>Use the number palette or keyboard (1–9) to fill in digits.</li>
            <li>
              Toggle <strong>Notes Mode</strong> to jot down possible numbers.
            </li>
            <li>
              Click <strong>Validate</strong> to check for mistakes.
            </li>
            <li>
              Use <strong>Undo</strong> and <strong>Redo</strong> to revert moves.
            </li>
            <li>
              Click <strong>Hint</strong> to reveal a random correct number.
            </li>
            <li>You win when the entire grid is correctly filled!</li>
          </ul>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Text type="secondary">Made with ❤️ — responsive and keyboard friendly.</Text>
        </div>
      </Card>
    </div>
  );
};

export default SudokuPage;
