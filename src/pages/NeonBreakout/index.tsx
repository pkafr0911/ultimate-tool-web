import { Link } from '@umijs/max';
import { Button, ConfigProvider, Modal, theme } from 'antd';
import React, { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { BreakoutGame, levels } from './model';
import styles from './styles.less';
const Scene = lazy(() => import('./Scene'));
export default function NeonBreakout() {
  const [game] = useState(() => new BreakoutGame());
  const [, redraw] = useReducer((n) => n + 1, 0);
  const [help, setHelp] = useState(false);
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem('neon-breakout.sound.v1') === 'on';
    } catch {
      return false;
    }
  });
  const host = useRef<HTMLDivElement>(null);
  const focus = () =>
    requestAnimationFrame(() =>
      host.current?.querySelector<HTMLElement>('[aria-label^="Neon Breakout arena"]')?.focus(),
    );
  useEffect(() => {
    game.onChange = redraw;
    const hide = () => {
      if (document.hidden && !game.paused) game.pause();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      game.onChange = () => {};
      document.removeEventListener('visibilitychange', hide);
    };
  }, [game]);
  useEffect(() => {
    try {
      localStorage.setItem('neon-breakout.sound.v1', sound ? 'on' : 'off');
    } catch {
      /* Optional preference. */
    }
  }, [sound]);
  const playing = ['serve', 'playing'].includes(game.phase);
  const guide = () => {
    if (playing && !game.paused) game.pause();
    setHelp(true);
  };
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#70e6da', colorBgContainer: '#11182b', borderRadius: 10 },
      }}
    >
      <main className={styles.page} ref={host}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>THE AFTER-HOURS ARCADE / 03</span>
            <h1>
              NEON<span>BREAKOUT</span>
            </h1>
            <p>Find the angle. Start a chain reaction.</p>
          </div>
          <Link to="/">← Back to tools</Link>
        </header>
        <div className={styles.layout}>
          <section className={styles.cabinet} aria-label="Neon Breakout game">
            <div className={styles.hud}>
              <div>
                <small>SCORE</small>
                <strong>{game.score.toLocaleString()}</strong>
              </div>
              <div>
                <small>BEST</small>
                <strong>{game.best.toLocaleString()}</strong>
              </div>
              <div>
                <small>LIVES</small>
                <strong aria-label={`${game.lives} lives`}>{'● '.repeat(game.lives)}</strong>
              </div>
              <Button
                disabled={!playing}
                onClick={() => {
                  game.pause();
                  focus();
                }}
              >
                {game.paused ? 'Resume' : 'Pause'}
              </Button>
            </div>
            <div className={styles.viewport}>
              <Suspense fallback={<div className={styles.fallback}>Powering up the arena…</div>}>
                <Scene game={game} sound={sound} />
              </Suspense>
              {game.phase === 'serve' && !game.paused && (
                <div className={styles.launchHint} role="status">
                  CLICK / TAP / SPACE TO LAUNCH
                </div>
              )}
              {(!playing || game.paused) && (
                <div className={styles.overlay}>
                  <div className={styles.panel}>
                    <span className={styles.eyebrow}>
                      {game.paused
                        ? 'TIME OUT'
                        : game.phase === 'menu'
                          ? 'SIX ARENAS. THREE LIVES.'
                          : game.phase === 'cleared'
                            ? `LEVEL ${game.level + 1} CLEAR`
                            : game.phase === 'won'
                              ? 'CAMPAIGN COMPLETE'
                              : 'GAME OVER'}
                    </span>
                    <h2>
                      {game.paused ? (
                        'Catch your breath.'
                      ) : game.phase === 'menu' ? (
                        <>
                          Break the
                          <br />
                          night open.
                        </>
                      ) : game.phase === 'cleared' ? (
                        'Clean sweep.'
                      ) : game.phase === 'won' ? (
                        'Neon royalty.'
                      ) : (
                        'One more run?'
                      )}
                    </h2>
                    <p>
                      {game.phase === 'menu'
                        ? 'Keep the ball alive. Shatter the grid. Make every bounce count.'
                        : `${game.score.toLocaleString()} points · ${levels[game.level]}`}
                    </p>
                    {game.phase === 'menu' && game.saved && (
                      <Button
                        size="large"
                        block
                        onClick={() => {
                          game.start(true);
                          focus();
                        }}
                      >
                        Resume level {game.saved.level + 1}
                      </Button>
                    )}
                    <Button
                      size="large"
                      type="primary"
                      block
                      onClick={() => {
                        if (game.paused) game.pause();
                        else if (game.phase === 'cleared') game.next();
                        else game.start();
                        focus();
                      }}
                    >
                      {game.paused
                        ? 'Resume'
                        : game.phase === 'cleared'
                          ? game.level === 5
                            ? 'View final result'
                            : 'Next arena →'
                          : game.phase === 'menu'
                            ? 'Start campaign →'
                            : 'Play again →'}
                    </Button>
                    <button type="button" className={styles.textButton} onClick={guide}>
                      How to play
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.status}>
              <span>
                0{game.level + 1} / {levels[game.level]}
              </span>
              <span role="status">
                {game.wide > 0 ? `WIDE ${Math.ceil(game.wide)}s ` : ''}
                {game.slow > 0 ? `SLOW ${Math.ceil(game.slow)}s` : ''}
              </span>
            </div>
          </section>
          <aside className={styles.sidebar}>
            <section className={styles.card}>
              <span className={styles.eyebrow}>CONTROL THE BOUNCE</span>
              <h2>
                Your angle.
                <br />
                Your advantage.
              </h2>
              <div className={styles.diagram} aria-hidden="true">
                ↖ ↑ ↗<i />
              </div>
              <p>
                Hit near the paddle’s center for a straight return. Catch the edge to send the ball
                across the arena.
              </p>
              <div className={styles.keys}>
                <kbd>←</kbd>
                <kbd>→</kbd>
                <span>or A / D to move</span>
              </div>
              <p>Mouse follows directly. On touch, drag below the ball to keep your view clear.</p>
            </section>
            <section className={styles.card}>
              <span className={styles.eyebrow}>CATCH A LITTLE ADVANTAGE</span>
              <ul className={styles.powerList}>
                <li>
                  <b>━</b>
                  <div>
                    Wide paddle<small>More room. 12 seconds.</small>
                  </div>
                </li>
                <li>
                  <b>▯</b>
                  <div>
                    Slow ball<small>Take control. 10 seconds.</small>
                  </div>
                </li>
                <li>
                  <b>◆</b>
                  <div>
                    Multiball<small>Up to three balls in play.</small>
                  </div>
                </li>
              </ul>
            </section>
            <section className={styles.card}>
              <span className={styles.eyebrow}>THE CAMPAIGN</span>
              <ol className={styles.levels}>
                {levels.map((name, i) => (
                  <li key={name} className={i === game.level ? styles.current : undefined}>
                    <span>0{i + 1}</span>
                    {name}
                    <span>{i < game.level ? '✓' : i === game.level ? '←' : ''}</span>
                  </li>
                ))}
              </ol>
            </section>
            <div className={styles.options}>
              <Button onClick={guide}>How to play</Button>
              <Button aria-pressed={sound} onClick={() => setSound(!sound)}>
                Sound {sound ? 'on' : 'off'}
              </Button>
            </div>
            <small className={styles.local}>Progress saves at the start of each level.</small>
          </aside>
        </div>
        <Modal
          open={help}
          title="Welcome to the after-hours arcade"
          onCancel={() => setHelp(false)}
          footer={<Button onClick={() => setHelp(false)}>Got it</Button>}
        >
          <p>
            Move with the mouse, drag on touch, or focus the arena and use arrows / A and D. Click,
            tap, or Space launches. Escape pauses.
          </p>
          <p>
            Pink bricks take one hit. Cyan armored bricks have two segments. Amber + bricks explode
            into their neighbors. Metal barriers reflect the ball and do not need clearing.
          </p>
          <p>
            Catch falling power-ups: a green bar widens the paddle, a blue capsule slows the balls,
            and a pink diamond adds balls. You lose a life only when all balls are gone.
          </p>
          <p>
            Consecutive brick destructions before a paddle bounce raise the score multiplier, up to
            5×. Clear all destructible bricks to advance. Reloading resumes the start of your last
            saved level.
          </p>
        </Modal>
      </main>
    </ConfigProvider>
  );
}
