// ChessGame — full rules: castling, en-passant, promotion dialog, SAN history,
// captured pieces, last-move highlight, check highlight, hint via board highlight.
import { Button, Card, Modal, Tag, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.less';

const { Title, Text } = Typography;

/* ─── Types ──────────────────────────────────────────────────────────────────*/
type Color = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Piece = { type: PieceType; color: Color; id: string };
type Square = Piece | null;
type Coord = { r: number; c: number };
type CastlingRights = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };

type Move = {
  from: Coord;
  to: Coord;
  piece: Piece;
  captured: Piece | null;
  promotion: PieceType | null;
  isCastle: 'kingside' | 'queenside' | null;
  isEnPassant: boolean;
  san: string;
};

type GameState = {
  board: Square[][];
  castling: CastlingRights;
  enPassant: Coord | null;
  turn: Color;
};

type HistoryRecord = {
  state: GameState;
  move: Move;
  next: GameState;
};

/* ─── Constants ──────────────────────────────────────────────────────────────*/
const INIT_CASTLING: CastlingRights = { wK: true, wQ: true, bK: true, bQ: true };

const SYM: Record<Color, Record<PieceType, string>> = {
  w: { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙' },
  b: { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' },
};

const PIECE_VAL: Record<PieceType, number> = { K: 0, Q: 9, R: 5, B: 3, N: 3, P: 1 };
const PROMO_TYPES: PieceType[] = ['Q', 'R', 'B', 'N'];
const PROMO_NAMES: Record<PieceType, string> = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', K: '', P: '' };
const FILES = 'abcdefgh';

/* ─── Utility ────────────────────────────────────────────────────────────────*/
let _pid = 0;
const newId = () => `p${++_pid}`;
const cloneBoard = (b: Square[][]): Square[][] => b.map((row) => row.map((p) => (p ? { ...p } : null)));
const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const opp = (color: Color): Color => (color === 'w' ? 'b' : 'w');
const toAlg = (sq: Coord) => `${FILES[sq.c]}${8 - sq.r}`;

/* ─── Board Initialization ───────────────────────────────────────────────────*/
const makeInitialBoard = (): Square[][] => {
  const b: Square[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c], color: 'b', id: newId() };
    b[1][c] = { type: 'P', color: 'b', id: newId() };
    b[6][c] = { type: 'P', color: 'w', id: newId() };
    b[7][c] = { type: back[c], color: 'w', id: newId() };
  }
  return b;
};

const makeInitialState = (): GameState => ({
  board: makeInitialBoard(),
  castling: { ...INIT_CASTLING },
  enPassant: null,
  turn: 'w',
});

/* ─── Move Generation ────────────────────────────────────────────────────────*/

/**
 * Return pseudo-legal destination squares for the piece at [r, c].
 * Pass NO_CASTLE + null enPassant when computing attacks (prevents infinite recursion).
 */
function pseudoTargets(
  board: Square[][],
  r: number,
  c: number,
  castling: CastlingRights,
  enPassant: Coord | null,
): Coord[] {
  const p = board[r][c];
  if (!p) return [];
  const { color } = p;
  const moves: Coord[] = [];

  const add = (rr: number, cc: number) => {
    if (!inBounds(rr, cc)) return;
    const occ = board[rr][cc];
    if (!occ || occ.color !== color) moves.push({ r: rr, c: cc });
  };

  switch (p.type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push({ r: r + dir, c });
        if (r === startRow && !board[r + 2 * dir][c]) moves.push({ r: r + 2 * dir, c });
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const t = board[nr][nc];
        if (t && t.color !== color) moves.push({ r: nr, c: nc });
        else if (enPassant && enPassant.r === nr && enPassant.c === nc) moves.push({ r: nr, c: nc });
      }
      break;
    }
    case 'N':
      for (const [dr, dc] of [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2],
      ] as [number, number][]) add(r + dr, c + dc);
      break;
    case 'B':
    case 'R':
    case 'Q': {
      const diags: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      const straights: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const dirs = p.type === 'B' ? diags : p.type === 'R' ? straights : [...diags, ...straights];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (inBounds(rr, cc)) {
          if (board[rr][cc]) {
            if (board[rr][cc]!.color !== color) moves.push({ r: rr, c: cc });
            break;
          }
          moves.push({ r: rr, c: cc });
          rr += dr; cc += dc;
        }
      }
      break;
    }
    case 'K': {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) add(r + dr, c + dc);
      const homeRow = color === 'w' ? 7 : 0;
      if (r === homeRow && c === 4) {
        if ((color === 'w' ? castling.wK : castling.bK) && !board[homeRow][5] && !board[homeRow][6])
          moves.push({ r: homeRow, c: 6 });
        if ((color === 'w' ? castling.wQ : castling.bQ) && !board[homeRow][1] && !board[homeRow][2] && !board[homeRow][3])
          moves.push({ r: homeRow, c: 2 });
      }
      break;
    }
  }
  return moves;
}

const NO_CASTLE: CastlingRights = { wK: false, wQ: false, bK: false, bQ: false };

function isAttacked(board: Square[][], sq: Coord, byColor: Color): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== byColor) continue;
      if (pseudoTargets(board, r, c, NO_CASTLE, null).some((t) => t.r === sq.r && t.c === sq.c))
        return true;
    }
  return false;
}

function findKing(board: Square[][], color: Color): Coord | null {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === 'K' && board[r][c]!.color === color) return { r, c };
  return null;
}

function getAllLegalMoves(gs: GameState): Move[] {
  const { board, castling, enPassant, turn } = gs;
  const result: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== turn) continue;
      for (const t of pseudoTargets(board, r, c, castling, enPassant)) {
        const castle: Move['isCastle'] =
          piece.type === 'K' && Math.abs(t.c - c) === 2
            ? t.c > c ? 'kingside' : 'queenside'
            : null;
        const isEP = piece.type === 'P' && t.c !== c && !board[t.r][t.c];
        const captured: Piece | null = isEP
          ? (board[r][t.c] ?? null)
          : (board[t.r][t.c] ?? null);
        const isPromo = piece.type === 'P' && (t.r === 0 || t.r === 7);

        const mv: Move = {
          from: { r, c },
          to: t,
          piece,
          captured,
          promotion: isPromo ? 'Q' : null,
          isCastle: castle,
          isEnPassant: isEP,
          san: '',
        };

        const nb = applyMoveTo(board, mv);
        const kp = findKing(nb, turn);
        if (!kp || isAttacked(nb, kp, opp(turn))) continue;

        if (castle) {
          const kp2 = findKing(board, turn)!;
          if (isAttacked(board, kp2, opp(turn))) continue;
          const passCol = castle === 'kingside' ? c + 1 : c - 1;
          if (isAttacked(board, { r, c: passCol }, opp(turn))) continue;
        }

        result.push(mv);
      }
    }
  }
  return result;
}

/* ─── Move Application ───────────────────────────────────────────────────────*/
function applyMoveTo(board: Square[][], mv: Move): Square[][] {
  const b = cloneBoard(board);
  const p = b[mv.from.r][mv.from.c]!;
  b[mv.to.r][mv.to.c] = mv.promotion
    ? { type: mv.promotion, color: p.color, id: newId() }
    : { ...p };
  b[mv.from.r][mv.from.c] = null;

  if (mv.isCastle) {
    const row = p.color === 'w' ? 7 : 0;
    if (mv.isCastle === 'kingside') { b[row][5] = { ...b[row][7]! }; b[row][7] = null; }
    else                            { b[row][3] = { ...b[row][0]! }; b[row][0] = null; }
  }
  if (mv.isEnPassant) b[mv.from.r][mv.to.c] = null;

  return b;
}

function nextCastling(rights: CastlingRights, mv: Move): CastlingRights {
  const c = { ...rights };
  if (mv.piece.type === 'K') {
    if (mv.piece.color === 'w') { c.wK = false; c.wQ = false; }
    else                        { c.bK = false; c.bQ = false; }
  }
  if (mv.from.r === 7 && mv.from.c === 7) c.wK = false;
  if (mv.from.r === 7 && mv.from.c === 0) c.wQ = false;
  if (mv.from.r === 0 && mv.from.c === 7) c.bK = false;
  if (mv.from.r === 0 && mv.from.c === 0) c.bQ = false;
  if (mv.to.r === 7 && mv.to.c === 7) c.wK = false;
  if (mv.to.r === 7 && mv.to.c === 0) c.wQ = false;
  if (mv.to.r === 0 && mv.to.c === 7) c.bK = false;
  if (mv.to.r === 0 && mv.to.c === 0) c.bQ = false;
  return c;
}

function nextEnPassant(mv: Move): Coord | null {
  if (mv.piece.type === 'P' && Math.abs(mv.to.r - mv.from.r) === 2)
    return { r: (mv.from.r + mv.to.r) >> 1, c: mv.from.c };
  return null;
}

/* ─── SAN Notation ───────────────────────────────────────────────────────────*/
function makeSAN(mv: Move, allLegal: Move[], afterState: GameState): string {
  if (mv.isCastle === 'kingside')  return withCheck('O-O', afterState);
  if (mv.isCastle === 'queenside') return withCheck('O-O-O', afterState);

  let s = '';
  const { piece, from, to, captured, promotion, isEnPassant } = mv;
  if (piece.type !== 'P') {
    s += piece.type;
    const ambig = allLegal.filter(
      (m) =>
        m.piece.type === piece.type &&
        !(m.from.r === from.r && m.from.c === from.c) &&
        m.to.r === to.r && m.to.c === to.c,
    );
    if (ambig.length > 0) {
      const sameFile = ambig.some((m) => m.from.c === from.c);
      const sameRank = ambig.some((m) => m.from.r === from.r);
      if (!sameFile)      s += FILES[from.c];
      else if (!sameRank) s += String(8 - from.r);
      else                s += toAlg(from);
    }
  }

  if (captured || isEnPassant) {
    if (piece.type === 'P') s += FILES[from.c];
    s += 'x';
  }

  s += toAlg(to);
  if (promotion) s += `=${promotion}`;
  return withCheck(s, afterState);
}

function withCheck(san: string, gs: GameState): string {
  const kp = findKing(gs.board, gs.turn);
  if (!kp || !isAttacked(gs.board, kp, opp(gs.turn))) return san;
  const legal = getAllLegalMoves(gs);
  return san + (legal.length === 0 ? '#' : '+');
}

/* ─── Component ──────────────────────────────────────────────────────────────*/
export default function ChessGame(): JSX.Element {
  const [gs, setGs] = useState<GameState>(makeInitialState);
  const [selected, setSelected] = useState<Coord | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [orientation, setOrientation] = useState<Color>('w');
  const [pendingPromo, setPendingPromo] = useState<Move | null>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [hintCoords, setHintCoords] = useState<Coord[] | null>(null);

  const pastRef = useRef<HistoryRecord[]>([]);
  const futureRef = useRef<HistoryRecord[]>([]);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  /* ── Derived ─────────────────────────────────────────────────────────────── */
  const allLegal  = useMemo(() => getAllLegalMoves(gs), [gs]);
  const kingPos   = useMemo(() => findKing(gs.board, gs.turn), [gs]);
  const inCheck   = useMemo(() => (kingPos ? isAttacked(gs.board, kingPos, opp(gs.turn)) : false), [gs, kingPos]);

  const gameStatus = useMemo<'playing' | 'checkmate' | 'stalemate'>(() => {
    if (allLegal.length > 0) return 'playing';
    return inCheck ? 'checkmate' : 'stalemate';
  }, [allLegal, inCheck]);

  const selectedLegal = useMemo(
    () => (selected ? allLegal.filter((m) => m.from.r === selected.r && m.from.c === selected.c) : []),
    [allLegal, selected],
  );

  const whiteCaptured = useMemo(
    () => moves.filter((m) => m.piece.color === 'w').flatMap((m) => (m.captured ? [m.captured] : [])),
    [moves],
  );
  const blackCaptured = useMemo(
    () => moves.filter((m) => m.piece.color === 'b').flatMap((m) => (m.captured ? [m.captured] : [])),
    [moves],
  );
  const whiteMat = useMemo(() => whiteCaptured.reduce((s, p) => s + PIECE_VAL[p.type], 0), [whiteCaptured]);
  const blackMat = useMemo(() => blackCaptured.reduce((s, p) => s + PIECE_VAL[p.type], 0), [blackCaptured]);

  const movePairs = useMemo(() => {
    const pairs: [Move, Move | null][] = [];
    for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i], moves[i + 1] ?? null]);
    return pairs;
  }, [moves]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  /* ── Core move logic ─────────────────────────────────────────────────────── */
  const commitMove = (mv: Move) => {
    const nb = applyMoveTo(gs.board, mv);
    const nc = nextCastling(gs.castling, mv);
    const ne = nextEnPassant(mv);
    const nt = opp(gs.turn);
    const next: GameState = { board: nb, castling: nc, enPassant: ne, turn: nt };
    const san = makeSAN(mv, allLegal, next);
    const final: Move = { ...mv, san };

    pastRef.current.push({ state: gs, move: final, next });
    futureRef.current = [];
    setGs(next);
    setMoves(pastRef.current.map((r) => r.move));
    setLastMove(final);
    setSelected(null);
    setHintCoords(null);

    const legalNext = getAllLegalMoves(next);
    if (legalNext.length === 0) {
      const kp = findKing(nb, nt);
      const mate = kp ? isAttacked(nb, kp, opp(nt)) : false;
      setGameOver(
        mate
          ? `${gs.turn === 'w' ? 'White' : 'Black'} wins by checkmate! 🎉`
          : "It's a draw by stalemate. 🤝",
      );
    }
  };

  /* ── Event Handlers ───────────────────────────────────────────────────────── */
  const handleSquareClick = (r: number, c: number) => {
    if (gameOver) return;
    const sq = gs.board[r][c];

    if (sq && sq.color === gs.turn) {
      setSelected({ r, c });
      return;
    }

    const mv = selectedLegal.find((m) => m.to.r === r && m.to.c === c);
    if (selected && mv) {
      if (mv.promotion !== null) {
        setPendingPromo(mv);
      } else {
        commitMove(mv);
      }
      return;
    }

    setSelected(null);
  };

  const handlePromoChoice = (piece: PieceType) => {
    if (!pendingPromo) return;
    commitMove({ ...pendingPromo, promotion: piece });
    setPendingPromo(null);
  };

  const undo = () => {
    if (!pastRef.current.length) return;
    const rec = pastRef.current.pop()!;
    futureRef.current.push(rec);
    setGs(rec.state);
    setMoves(pastRef.current.map((r) => r.move));
    setLastMove(pastRef.current.length > 0 ? pastRef.current[pastRef.current.length - 1].move : null);
    setSelected(null);
    setGameOver(null);
  };

  const redo = () => {
    if (!futureRef.current.length) return;
    const rec = futureRef.current.pop()!;
    pastRef.current.push(rec);
    setGs(rec.next);
    setMoves(pastRef.current.map((r) => r.move));
    setLastMove(rec.move);
    setSelected(null);
  };

  const restart = () => {
    pastRef.current = [];
    futureRef.current = [];
    setGs(makeInitialState());
    setMoves([]);
    setLastMove(null);
    setSelected(null);
    setGameOver(null);
    setHintCoords(null);
  };

  const showHint = () => {
    if (!allLegal.length) return;
    const captures = allLegal.filter((m) => m.captured || m.isEnPassant);
    const pool = captures.length > 0 ? captures : allLegal;
    const mv = pool[Math.floor(Math.random() * pool.length)];
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHintCoords([mv.from, mv.to]);
    hintTimer.current = setTimeout(() => setHintCoords(null), 2500);
  };

  /* ── Square class helper ─────────────────────────────────────────────────── */
  const squareClass = (r: number, c: number): string => {
    const dark = (r + c) % 2 === 1;
    const isSelected = selected?.r === r && selected?.c === c;
    const lm = selectedLegal.find((m) => m.to.r === r && m.to.c === c);
    const isLastFrom = lastMove && lastMove.from.r === r && lastMove.from.c === c;
    const isLastTo   = lastMove && lastMove.to.r === r && lastMove.to.c === c;
    const isHint     = hintCoords?.some((h) => h.r === r && h.c === c) ?? false;
    const isCheckKing = inCheck && kingPos?.r === r && kingPos?.c === c;

    return [
      'chess-square',
      dark ? 'dark' : 'light',
      isSelected ? 'selected' : '',
      (isLastFrom || isLastTo) && !isSelected ? 'last-move' : '',
      isHint ? 'hint' : '',
      isCheckKing ? 'in-check' : '',
      lm ? (lm.captured || lm.isEnPassant ? 'legal-capture' : 'legal-target') : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  /* ── Orientation helpers ─────────────────────────────────────────────────── */
  const visFiles = orientation === 'w'
    ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const visRanks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const topColor    = orientation === 'w' ? 'b' : 'w' as Color;
  const bottomColor = orientation === 'w' ? 'w' : 'b' as Color;

  /* ── Player bar ──────────────────────────────────────────────────────────── */
  const renderPlayerBar = (color: Color) => {
    const captured = color === 'w' ? whiteCaptured : blackCaptured;
    const myMat    = color === 'w' ? whiteMat : blackMat;
    const oppMat   = color === 'w' ? blackMat : whiteMat;
    const adv      = myMat - oppMat;
    return (
      <div className={`chess-player-bar ${color === 'w' ? 'bar-white' : 'bar-black'}`}>
        <span className="player-name">
          {SYM[color]['K']} <strong>{color === 'w' ? 'White' : 'Black'}</strong>
          {gs.turn === color && gameStatus === 'playing' && (
            <span className="turn-dot" title="Active turn" />
          )}
        </span>
        <span className="captured-pieces">
          {[...captured]
            .sort((a, b) => PIECE_VAL[b.type] - PIECE_VAL[a.type])
            .map((p, i) => (
              <span key={i} className="cap-piece">{SYM[p.color][p.type]}</span>
            ))}
          {adv > 0 && <span className="material-adv">+{adv}</span>}
        </span>
      </div>
    );
  };

  /* ── JSX ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="chess-page">
      {/* ── Header ── */}
      <div className="chess-header">
        <Title level={4} style={{ margin: 0 }}>Chess</Title>
        <div className="chess-controls">
          <span className="chess-status-label">
            {gameStatus === 'playing' ? (
              <>
                <Text>Turn: <strong>{gs.turn === 'w' ? 'White' : 'Black'}</strong></Text>
                {inCheck && <Tag color="red" style={{ marginLeft: 8 }}>Check!</Tag>}
              </>
            ) : (
              <Tag color={gameStatus === 'checkmate' ? 'volcano' : 'blue'} style={{ fontSize: 13 }}>
                {gameStatus === 'checkmate' ? 'Checkmate' : 'Stalemate'}
              </Tag>
            )}
          </span>
          <Button size="small" onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}>⇅ Flip</Button>
          <Button size="small" onClick={undo} disabled={!pastRef.current.length}>↩ Undo</Button>
          <Button size="small" onClick={redo} disabled={!futureRef.current.length}>↪ Redo</Button>
          <Button size="small" onClick={showHint} disabled={gameStatus !== 'playing'}>💡 Hint</Button>
          <Button size="small" danger onClick={restart}>↺ Restart</Button>
        </div>
      </div>

      <div className="chess-content">
        {/* ── Board section ── */}
        <div className="chess-board-section">
          {renderPlayerBar(topColor)}

          <div className="board-with-coords">
            <div className="coord-row">
              <div className="coord-corner" />
              {visFiles.map((f) => <div key={f} className="coord-cell file">{f}</div>)}
            </div>

            <div className="board-with-ranks">
              <div className="coord-col">
                {visRanks.map((r) => <div key={r} className="coord-cell rank">{r}</div>)}
              </div>

              <div className="chess-board">
                {Array.from({ length: 8 }, (_, rr) => {
                  const r = orientation === 'w' ? rr : 7 - rr;
                  return (
                    <div key={r} className="chess-row">
                      {Array.from({ length: 8 }, (_, cc) => {
                        const c = orientation === 'w' ? cc : 7 - cc;
                        const sq = gs.board[r][c];
                        const lm = selectedLegal.find((m) => m.to.r === r && m.to.c === c);
                        const isCapture = !!lm?.captured || !!lm?.isEnPassant;
                        const isTarget  = !!lm && !isCapture;

                        return (
                          <div
                            key={`${r}-${c}`}
                            className={squareClass(r, c)}
                            onClick={() => handleSquareClick(r, c)}
                          >
                            {sq && <span className="chess-piece">{SYM[sq.color][sq.type]}</span>}
                            {isTarget  && <div className="move-dot" />}
                            {isCapture && <div className="capture-ring" />}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="coord-row">
              <div className="coord-corner" />
              {visFiles.map((f) => <div key={f} className="coord-cell file">{f}</div>)}
            </div>
          </div>

          {renderPlayerBar(bottomColor)}
        </div>

        {/* ── Move history ── */}
        <Card className="move-history-card" title="Move History" size="small">
          {movePairs.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 12, padding: '4px 0', display: 'block' }}>
              No moves yet
            </Text>
          ) : (
            <div className="move-history-scroll">
              <table className="move-table">
                <tbody>
                  {movePairs.map(([wm, bm], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'move-row even' : 'move-row odd'}>
                      <td className="move-num">{i + 1}.</td>
                      <td className="move-san">{wm.san}</td>
                      <td className="move-san">{bm?.san ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={historyEndRef} />
            </div>
          )}
        </Card>
      </div>

      {/* ── Promotion Modal ── */}
      <Modal
        open={!!pendingPromo}
        title="Promote Pawn — choose a piece"
        footer={null}
        closable
        onCancel={() => { setPendingPromo(null); setSelected(null); }}
        width={340}
        centered
      >
        <div className="promo-choices">
          {PROMO_TYPES.map((pt) => (
            <button key={pt} className="promo-btn" onClick={() => handlePromoChoice(pt)}>
              <span className="promo-piece">{SYM[pendingPromo ? pendingPromo.piece.color : 'w'][pt]}</span>
              <span className="promo-name">{PROMO_NAMES[pt]}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* ── Game Over Modal ── */}
      <Modal
        open={!!gameOver}
        title="Game Over"
        footer={[
          <Button key="close" onClick={() => setGameOver(null)}>Close</Button>,
          <Button key="restart" type="primary" onClick={restart}>Play Again</Button>,
        ]}
        onCancel={() => setGameOver(null)}
        centered
      >
        <p className="game-over-msg">{gameOver}</p>
      </Modal>
    </div>
  );
}
