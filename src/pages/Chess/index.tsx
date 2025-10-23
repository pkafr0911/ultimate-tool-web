// ChessGame.tsx
// Single-file React + TypeScript chess component
// - No external chess engine/library required (lightweight move generator)
// - Features: two-player local play, move highlighting, move history, undo/redo, restart, auto-promotion to queen
// - Limitations: simplified rules (no en-passant, no castling prioritised in this initial version). Check detection implemented; basic checkmate/stalemate detection included.
import { Button, Card, List, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.less';

const { Title, Text } = Typography;

// --------------------------
// Types
// --------------------------

type Color = 'w' | 'b';

type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

type Piece = {
  type: PieceType;
  color: Color;
  id: string; // unique id for React keys
};

type Square = Piece | null;

type Coord = { r: number; c: number };

type Move = {
  from: Coord;
  to: Coord;
  piece: Piece;
  captured?: Piece | null;
  promotion?: PieceType | null;
};

// --------------------------
// Helpers
// --------------------------

const cloneBoard = (board: Square[][]) => board.map((row) => row.map((p) => (p ? { ...p } : null)));

const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const opposite = (color: Color) => (color === 'w' ? 'b' : 'w');

const newId = (() => {
  let i = 0;
  return () => `p_${++i}`;
})();

// create initial standard chess starting position
const initialBoard = (): Square[][] => {
  const empty: Square[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  const backRank: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    empty[0][c] = { type: backRank[c], color: 'b', id: newId() };
    empty[1][c] = { type: 'P', color: 'b', id: newId() };
    empty[6][c] = { type: 'P', color: 'w', id: newId() };
    empty[7][c] = { type: backRank[c], color: 'w', id: newId() };
  }
  return empty;
};

// find king coordinate for color
const findKing = (board: Square[][], color: Color): Coord | null => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === 'K' && board[r][c]!.color === color) return { r, c };
  return null;
};

// generate pseudo-legal moves for a piece at r,c (not considering self-check)
const generatePieceMoves = (board: Square[][], r: number, c: number): Coord[] => {
  const p = board[r][c];
  if (!p) return [];
  const moves: Coord[] = [];
  const color = p.color;

  const addIf = (rr: number, cc: number) => {
    if (!inside(rr, cc)) return;
    const target = board[rr][cc];
    if (!target || target.color !== color) moves.push({ r: rr, c: cc });
  };

  if (p.type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    // one forward
    if (inside(r + dir, c) && !board[r + dir][c]) moves.push({ r: r + dir, c });
    // two forward from start
    if (r === startRow && !board[r + dir][c] && !board[r + 2 * dir][c])
      moves.push({ r: r + 2 * dir, c });
    // captures
    for (const dc of [-1, 1]) {
      const rr = r + dir;
      const cc = c + dc;
      if (inside(rr, cc) && board[rr][cc] && board[rr][cc]!.color !== color)
        moves.push({ r: rr, c: cc });
    }
    // NOTE: en-passant omitted in this simplified implementation
  }

  if (p.type === 'N') {
    const deltas = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];
    for (const [dr, dc] of deltas) addIf(r + dr, c + dc);
  }

  if (p.type === 'B' || p.type === 'R' || p.type === 'Q') {
    const dirs: number[][] = [];
    if (p.type === 'B' || p.type === 'Q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    if (p.type === 'R' || p.type === 'Q') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    for (const [dr, dc] of dirs) {
      let rr = r + dr;
      let cc = c + dc;
      while (inside(rr, cc)) {
        if (!board[rr][cc]) moves.push({ r: rr, c: cc });
        else {
          if (board[rr][cc]!.color !== color) moves.push({ r: rr, c: cc });
          break;
        }
        rr += dr;
        cc += dc;
      }
    }
  }

  if (p.type === 'K') {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if (dr !== 0 || dc !== 0) addIf(r + dr, c + dc);
    // NOTE: castling omitted for simplicity
  }

  return moves;
};

// check if a square is attacked by color
const isSquareAttacked = (board: Square[][], sq: Coord, byColor: Color): boolean => {
  // iterate all squares of byColor and see if any pseudo-move targets sq
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== byColor) continue;
      const moves = generatePieceMoves(board, r, c);
      if (moves.some((m) => m.r === sq.r && m.c === sq.c)) return true;
    }
  return false;
};

// generate all legal moves for a color (filtering moves that leave king in check)
const generateAllLegalMoves = (board: Square[][], color: Color): Move[] => {
  const out: Move[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      const targets = generatePieceMoves(board, r, c);
      for (const t of targets) {
        const newB = cloneBoard(board);
        const moving = newB[r][c]!;
        const captured = newB[t.r][t.c];
        newB[t.r][t.c] = moving;
        newB[r][c] = null;
        // promotion auto-queen when pawn reaches last rank
        let promotion: PieceType | null = null;
        if (moving.type === 'P' && (t.r === 0 || t.r === 7)) {
          newB[t.r][t.c] = { type: 'Q', color: moving.color, id: newId() };
          promotion = 'Q';
        }
        // find king pos for color after move
        const kingPos = findKing(newB, color);
        const inCheck = kingPos ? isSquareAttacked(newB, kingPos, opposite(color)) : true;
        if (!inCheck)
          out.push({ from: { r, c }, to: t, piece: p, captured: captured ?? null, promotion });
      }
    }
  return out;
};

// apply move to board and return new board
const applyMove = (board: Square[][], mv: Move) => {
  const b = cloneBoard(board);
  const p = b[mv.from.r][mv.from.c]!;
  // handle promotion if specified
  if (mv.promotion) b[mv.to.r][mv.to.c] = { type: mv.promotion, color: p.color, id: newId() };
  else b[mv.to.r][mv.to.c] = { ...p };
  b[mv.from.r][mv.from.c] = null;
  return b;
};

// pretty algebraic for coordinates
const coordToAlg = (c: Coord) => `${'abcdefgh'[c.c]}${8 - c.r}`;

// --------------------------
// React component
// --------------------------

export default function ChessGame(): JSX.Element {
  const [board, setBoard] = useState<Square[][]>(() => initialBoard());
  const [turn, setTurn] = useState<Color>('w');
  const [selected, setSelected] = useState<Coord | null>(null);
  const [legalMoves, setLegalMoves] = useState<Coord[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const historyRef = useRef<Move[]>([]);
  const futureRef = useRef<Move[]>([]);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  // generate legal moves for the selected piece
  useEffect(() => {
    if (!selected) return setLegalMoves([]);
    const p = board[selected.r][selected.c];
    if (!p || p.color !== turn) return setLegalMoves([]);
    const moves = generateAllLegalMoves(board, turn).filter(
      (m) => m.from.r === selected.r && m.from.c === selected.c,
    );
    setLegalMoves(moves.map((m) => m.to));
  }, [selected, board, turn]);

  // move by clicking destination
  const handleSquareClick = (r: number, c: number) => {
    const sq = board[r][c];
    // if selecting own piece
    if (sq && sq.color === turn) {
      setSelected({ r, c });
      return;
    }

    // if a destination is legal
    const matched = legalMoves.some((m) => m.r === r && m.c === c);
    if (selected && matched) {
      const moves = generateAllLegalMoves(board, turn);
      const mv = moves.find(
        (m) => m.from.r === selected.r && m.from.c === selected.c && m.to.r === r && m.to.c === c,
      );
      if (!mv) return;
      // apply
      const newBoard = applyMove(board, mv);
      setBoard(newBoard);
      setTurn(opposite(turn));
      setSelected(null);
      // push history
      historyRef.current.push(mv);
      setHistory([...historyRef.current]);
      futureRef.current = [];
      setLegalMoves([]);
    } else {
      // clicking empty/other that is not legal deselects
      setSelected(null);
      setLegalMoves([]);
    }
  };

  const undo = () => {
    const h = historyRef.current;
    if (!h.length) return;
    const last = h.pop()!;
    // revert by reconstructing board from history (simple approach)
    // we'll replay moves from initialBoard up to remaining history
    const b = initialBoard();
    for (const m of h) {
      const applied = applyMove(b, m);
      // copy back
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) b[r][c] = applied[r][c];
    }
    futureRef.current.push(last);
    setBoard(cloneBoard(b));
    setHistory([...h]);
    setTurn((t) => opposite(t));
    setSelected(null);
  };

  const redo = () => {
    const f = futureRef.current;
    if (!f.length) return;
    const next = f.pop()!;
    historyRef.current.push(next);
    // apply next on current board
    const nb = applyMove(board, next);
    setBoard(nb);
    setHistory([...historyRef.current]);
    setTurn((t) => opposite(t));
    setSelected(null);
  };

  const restart = () => {
    setBoard(initialBoard());
    setTurn('w');
    setSelected(null);
    historyRef.current = [];
    futureRef.current = [];
    setHistory([]);
  };

  // compute game state: check, checkmate, stalemate
  const gameState = useMemo(() => {
    const kingPos = findKing(board, turn);
    const inCheck = kingPos ? isSquareAttacked(board, kingPos, opposite(turn)) : false;
    const legal = generateAllLegalMoves(board, turn);
    if (inCheck && legal.length === 0) return { status: 'checkmate' as const, inCheck };
    if (!inCheck && legal.length === 0) return { status: 'stalemate' as const, inCheck };
    return { status: 'playing' as const, inCheck };
  }, [board, turn]);

  // helpers for UI: piece symbol
  const pieceSymbol = (p: Piece) => {
    const map: Record<PieceType, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' };
    const s = map[p.type];
    return p.color === 'w'
      ? s
      : s
          .replace('♔', '♚')
          .replace('♕', '♛')
          .replace('♖', '♜')
          .replace('♗', '♝')
          .replace('♘', '♞')
          .replace('♙', '♟');
  };

  // quick hint: returns a legal move for current player (first available)
  const hint = () => {
    const legal = generateAllLegalMoves(board, turn);
    if (!legal.length) return alert('No legal moves');
    const m = legal[0];
    alert(`Try: ${coordToAlg(m.from)} → ${coordToAlg(m.to)}`);
  };

  return (
    <div className="chess-page">
      <div className="chess-header">
        <Title level={4}>Chess</Title>
        <div className="chess-controls">
          <Text className="chess-turn">
            Turn: <strong>{turn === 'w' ? 'White' : 'Black'}</strong>
            {gameState.inCheck && (
              <Text type="danger" className="ml-8">
                (Check)
              </Text>
            )}
          </Text>
          <Button
            size="small"
            onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
          >
            Flip
          </Button>
          <Button size="small" onClick={restart}>
            Restart
          </Button>
          <Button size="small" onClick={undo}>
            Undo
          </Button>
          <Button size="small" onClick={redo}>
            Redo
          </Button>
          <Button size="small" onClick={hint}>
            Hint
          </Button>
        </div>
      </div>

      <div className="chess-content">
        <div className="chess-board-wrapper">
          <div className="chess-board">
            {Array.from({ length: 8 }).map((_, rr) => {
              const r = orientation === 'white' ? rr : 7 - rr;
              return (
                <div key={r} className="chess-row">
                  {Array.from({ length: 8 }).map((_, cc) => {
                    const c = orientation === 'white' ? cc : 7 - cc;
                    const sq = board[r][c];
                    const isSelected = selected && selected.r === r && selected.c === c;
                    const isLegal = legalMoves.some((m) => m.r === r && m.c === c);
                    const dark = (r + c) % 2 === 1;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`chess-square ${dark ? 'dark' : 'light'} ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => handleSquareClick(r, c)}
                      >
                        {sq && <span className="chess-piece">{pieceSymbol(sq)}</span>}
                        {isLegal && <div className="move-dot" />}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <Card className="move-history" title="Move History" size="small">
          {history.length === 0 ? (
            <Text type="secondary">No moves yet</Text>
          ) : (
            <List
              size="small"
              bordered
              dataSource={history}
              renderItem={(m) => (
                <List.Item>
                  {coordToAlg(m.from)} → {coordToAlg(m.to)}
                  {m.captured ? ` × ${m.captured.type}` : ''}
                  {m.promotion ? ` (=${m.promotion})` : ''}
                </List.Item>
              )}
            />
          )}
          <div className="move-status">
            <Text>
              Status: <strong>{gameState.status}</strong>
            </Text>
          </div>
        </Card>
      </div>

      <Card size="small" className="chess-notes">
        <Text strong>Notes:</Text>
        <ul>
          <li>Local two-player game (alternate turns).</li>
          <li>Auto-promotion to Queen when pawn reaches last rank.</li>
          <li>Castling and en-passant are not supported in this version.</li>
          <li>If you'd like AI opponent, castling, or en-passant, tell me and I’ll add them.</li>
        </ul>
      </Card>
    </div>
  );
}
