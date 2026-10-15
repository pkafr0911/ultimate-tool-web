import { Button, ConfigProvider, Modal, theme } from 'antd';
import React, { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { ClassicGame, ClassicInput, Command, Difficulty, pieces, presets } from './model';
import styles from './styles.less';
const Scene = lazy(() => import('./Scene'));
function Preview({ id }: { id: number | null }) {
  if (id === null) return <span className={styles.empty}>Empty</span>;
  return (
    <svg viewBox="0 0 85 55" role="img" aria-label={`${pieces[id].name} piece`}>
      {pieces[id].matrix.flatMap((row, y) =>
        [...row].map((v, x) =>
          v === '1' ? (
            <rect
              key={`${x}-${y}`}
              x={8 + x * 17}
              y={y * 17 + 2}
              width="15"
              height="15"
              rx="2"
              fill={pieces[id].color}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
export default function Classic() {
  const [game] = useState(() => new ClassicGame()),
    [input] = useState(() => new ClassicInput(game));
  const [, redraw] = useReducer((n) => n + 1, 0);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [help, setHelp] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const focus = () =>
    host.current
      ?.querySelector<HTMLElement>('[aria-label^="Classic block board"]')
      ?.focus({ preventScroll: true });
  useEffect(() => {
    game.onChange = redraw;
    const hidden = () => {
      if (document.hidden) {
        input.clear();
        if (!game.paused) game.pause();
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      game.onChange = () => {};
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [game, input]);
  const start = () => {
    input.clear();
    game.start(difficulty);
    game.renderInput();
    focus();
  };
  const pause = () => {
    input.clear();
    game.pause();
    game.renderInput();
    focus();
  };
  const touchButton = (command: Command, label: string) => (
    <button
      type="button"
      disabled={!game.canPlay}
      key={command}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        focus();
        e.currentTarget.setPointerCapture(e.pointerId);
        input.press(command);
      }}
      onPointerUp={() => input.release(command)}
      onPointerCancel={() => input.release(command)}
      onLostPointerCapture={() => input.release(command)}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          input.press(command);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          input.release(command);
        }
      }}
      onBlur={() => input.release(command)}
    >
      {label}
    </button>
  );
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#a4dfd1', colorBgContainer: '#172635', borderRadius: 10 },
      }}
    >
      <main className={styles.page} ref={host}>
        <header className={styles.header}>
          <div>
            <span>THE ORIGINAL SHAPE OF A GOOD BREAK</span>
            <h1>
              Classic Stack<span> / 2D</span>
            </h1>
            <p>Ten columns. Seven pieces. One more line.</p>
          </div>
          <Button
            onClick={() => {
              if (!game.paused) game.pause();
              input.clear();
              setHelp(true);
            }}
          >
            Controls & rules
          </Button>
        </header>
        <div className={styles.layout}>
          <aside className={styles.left}>
            <section className={styles.card}>
              <small>HOLD · C / SHIFT</small>
              <Preview id={game.held} />
              <p>{game.holdUsed ? 'Available after placement' : 'Swap once per piece'}</p>
            </section>
            <section className={styles.card}>
              <small>DIFFICULTY</small>
              <strong>{presets[game.difficulty].name}</strong>
              <p>
                Level {game.level}
                <br />
                {Math.round(game.gravity * 1000)} ms per row
              </p>
            </section>
            <section className={styles.card}>
              <small>PERSONAL BEST</small>
              <strong>{game.best.toLocaleString()}</strong>
              <p>Saved per difficulty</p>
            </section>
          </aside>
          <section className={styles.game}>
            <div className={styles.hud}>
              <div>
                <small>SCORE</small>
                <b>{game.score.toLocaleString()}</b>
              </div>
              <div>
                <small>LINES</small>
                <b>{game.lines}</b>
              </div>
              <div>
                <small>LEVEL</small>
                <b>{game.level}</b>
              </div>
              <Button disabled={game.phase !== 'playing'} onClick={pause}>
                {game.paused ? 'Resume' : 'Pause'}
              </Button>
            </div>
            <div className={styles.viewport}>
              <Suspense fallback={<div className={styles.fallback}>Preparing the board…</div>}>
                <Scene game={game} input={input} />
              </Suspense>
              {(game.phase !== 'playing' || game.paused) && (
                <div className={styles.overlay}>
                  <div className={styles.panel}>
                    <small>
                      {game.paused
                        ? 'TAKE A BREATHER'
                        : game.phase === 'over'
                          ? 'STACK COMPLETE'
                          : 'CLASSIC RULES. SCULPTED BLOCKS.'}
                    </small>
                    <h2>
                      {game.paused
                        ? 'Your next move can wait.'
                        : game.phase === 'over'
                          ? 'Another round?'
                          : 'Find your rhythm.'}
                    </h2>
                    <p>
                      {game.phase === 'menu'
                        ? 'Fill complete rows to clear them. Choose your starting pace.'
                        : `${game.score.toLocaleString()} points · ${game.lines} lines`}
                    </p>
                    <fieldset className={styles.difficulties}>
                      <legend>Starting difficulty</legend>
                      {(Object.keys(presets) as Difficulty[]).map((key) => (
                        <label key={key}>
                          <input
                            type="radio"
                            name="classic-difficulty"
                            checked={difficulty === key}
                            onChange={() => setDifficulty(key)}
                          />
                          <span>
                            {presets[key].name}
                            <small>
                              Level {presets[key].start} · {presets[key].lock * 1000} ms lock
                            </small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    {game.paused && (
                      <Button block type="primary" size="large" onClick={pause}>
                        Resume current run
                      </Button>
                    )}
                    <Button
                      block
                      type={game.paused ? 'default' : 'primary'}
                      size="large"
                      onClick={start}
                    >
                      {game.paused ? 'New run with selected difficulty' : 'Start stacking →'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.touch}>
              {touchButton('left', '← Move')}
              {touchButton('right', 'Move →')}
              {touchButton('ccw', '↶ Rotate')}
              {touchButton('cw', 'Rotate ↷')}
              {touchButton('down', '↓ Soft drop')}
              {touchButton('hold', 'Hold')}
              {touchButton('drop', 'Hard drop')}
            </div>
          </section>
          <aside className={styles.right}>
            <section className={styles.card}>
              <small>NEXT FIVE</small>
              <div className={styles.next}>
                {game.queue.length ? (
                  game.queue.map((id, i) => <Preview key={i} id={id} />)
                ) : (
                  <p>Your next pieces appear here.</p>
                )}
              </div>
            </section>
            <section className={styles.card}>
              <small>AT YOUR FINGERTIPS</small>
              <p>
                <kbd>← →</kbd> Move
                <br />
                <kbd>↑ / X</kbd> Rotate
                <br />
                <kbd>Z</kbd> Reverse rotation
                <br />
                <kbd>↓</kbd> Soft drop
                <br />
                <kbd>Space</kbd> Hard drop
                <br />
                <kbd>C / Shift</kbd> Hold
                <br />
                <kbd>Esc</kbd> Pause
              </p>
              <p>Click the board to focus keyboard controls.</p>
            </section>
          </aside>
        </div>
        <Modal
          title="Classic mode"
          open={help}
          onCancel={() => setHelp(false)}
          footer={<Button onClick={() => setHelp(false)}>Got it</Button>}
        >
          <p>
            Clear complete rows on a 10×20 board. All seven tetrominoes appear once per shuffled
            bag. The outline shows the landing position. Hold swaps once per piece.
          </p>
          <p>
            Easy starts at level 1, Normal at 5, Hard at 10, and Expert at 15. Every ten lines
            raises the level. Difficulty changes take effect on a new run. Best scores are kept
            separately.
          </p>
          <p>
            Rotations use small wall and floor adjustments. The contact lock timer can reset up to
            ten times per piece. Hard drop locks immediately; soft drop accelerates falling. Top-out
            ends the run.
          </p>
          <p>
            Clear one/two/three/four rows for 100/300/500/800 × level points. Soft drop earns one
            point per cell; hard drop earns two. Pausing or leaving the tab stops play. Active runs
            are not saved.
          </p>
        </Modal>
      </main>
    </ConfigProvider>
  );
}
