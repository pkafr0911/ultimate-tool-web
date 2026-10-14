import { Link } from '@umijs/max';
import { Button, ConfigProvider, Modal, theme } from 'antd';
import { motion, useReducedMotion } from 'framer-motion';
import React, { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { TowerGame } from './model';
import styles from './styles.less';
const Scene = lazy(() => import('./Scene'));

export default function StackTower() {
  const [game] = useState(() => new TowerGame());
  const [, redraw] = useReducer((n) => n + 1, 0);
  const [help, setHelp] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem('stack-tower.sound.v1') === 'on';
    } catch {
      return false;
    }
  });
  const audio = useRef<AudioContext>();
  const container = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    setShowResult(false);
    if (game.phase !== 'gameOver') return;
    const timer = window.setTimeout(() => setShowResult(true), reduced ? 0 : 700);
    return () => window.clearTimeout(timer);
  }, [game.phase, reduced]);
  const focusScene = () =>
    requestAnimationFrame(() =>
      container.current
        ?.querySelector<HTMLElement>('[aria-label^="Stack Tower play area"]')
        ?.focus({ preventScroll: true }),
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
      void audio.current?.close();
      audio.current = undefined;
    };
  }, [game]);
  useEffect(() => {
    try {
      localStorage.setItem('stack-tower.sound.v1', sound ? 'on' : 'off');
    } catch {
      /* Optional preference. */
    }
    game.onSound = (event) => {
      if (!sound) return;
      try {
        const ctx = audio.current ?? new AudioContext();
        audio.current = ctx;
        void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const time = ctx.currentTime;
        const frequency =
          event === 'miss' ? 180 : event === 'perfect' ? 520 + Math.min(game.streak, 12) * 45 : 330;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);
        osc.frequency.exponentialRampToValueAtTime(
          event === 'miss' ? 55 : frequency * 1.2,
          time + 0.15,
        );
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
        osc.start(time);
        osc.stop(time + 0.25);
      } catch {
        /* Sound is optional. */
      }
    };
    return () => {
      game.onSound = () => {};
    };
  }, [game, sound]);
  const active = game.phase === 'playing' || game.phase === 'placing';
  const showHelp = () => {
    if (active && !game.paused) game.pause();
    setHelp(true);
  };
  const start = () => {
    game.start();
    focusScene();
  };
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { colorPrimary: '#635269', borderRadius: 12, fontFamily: 'inherit' },
      }}
    >
      <main className={styles.page} ref={container}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>A SMALL EXERCISE IN TIMING</span>
            <h1>
              Stack Tower<span>.</span>
            </h1>
            <p>One block. One moment. A little higher.</p>
          </div>
          <Link to="/" className={styles.back}>
            ← Back to tools
          </Link>
        </header>
        <div className={styles.layout}>
          <section className={styles.stage} aria-label="Stack Tower game">
            <Suspense fallback={<div className={styles.loading}>Setting the foundation…</div>}>
              <Scene game={game} />
            </Suspense>
            <div className={styles.score} aria-live="off">
              <span>LAYERS</span>
              <motion.strong
                key={game.score}
                initial={reduced ? false : { scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {String(game.score).padStart(2, '0')}
              </motion.strong>
              <small>BEST {game.best}</small>
            </div>
            <div className={styles.stageActions}>
              <Button
                disabled={!active}
                onClick={() => {
                  game.pause();
                  focusScene();
                }}
              >
                {game.paused ? 'Resume' : 'Pause'}
              </Button>
            </div>
            <div className={styles.feedback} role="status" aria-live="polite">
              {game.feedback && (
                <motion.div
                  key={game.score}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <strong>{game.feedback}</strong>
                  <span>{game.streak > 1 ? `${game.streak} in a row` : 'Right on the mark.'}</span>
                </motion.div>
              )}
            </div>
            {active && !game.paused && (
              <div className={styles.tapHint}>
                {game.score === 0
                  ? 'TAP ANYWHERE ON THE COURSE · OR PRESS SPACE'
                  : game.phase === 'placing'
                    ? 'NICE. KEEP GOING.'
                    : 'TAP / SPACE TO STACK'}
              </div>
            )}
            {(game.phase === 'ready' ||
              (game.phase === 'gameOver' && showResult) ||
              game.paused) && (
              <div className={styles.overlay}>
                <motion.div
                  className={styles.panel}
                  key={`${game.phase}-${game.paused}`}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className={styles.eyebrow}>
                    {game.phase === 'ready'
                      ? 'BUILD YOUR MOMENT'
                      : game.paused
                        ? 'TAKE A BREATH'
                        : game.newBest
                          ? 'A NEW PERSONAL BEST'
                          : 'THAT’S YOUR TOWER'}
                  </span>
                  <h2>
                    {game.phase === 'ready' ? (
                      <>
                        How high
                        <br />
                        can you go?
                      </>
                    ) : game.paused ? (
                      'Hold that thought.'
                    ) : game.score === 0 ? (
                      'Find your rhythm.'
                    ) : (
                      'A little masterpiece.'
                    )}
                  </h2>
                  <p>
                    {game.phase === 'ready'
                      ? 'Place each moving block. Keep the overlap. Let the rest fall away.'
                      : game.paused
                        ? 'Your tower will be right here when you’re ready.'
                        : `${game.score} ${game.score === 1 ? 'layer' : 'layers'} placed. Highest perfect streak: ${game.highestStreak}.`}
                  </p>
                  <Button
                    size="large"
                    type="primary"
                    block
                    onClick={() => {
                      if (game.paused) {
                        game.pause();
                        focusScene();
                      } else start();
                    }}
                  >
                    {game.paused
                      ? 'Keep building'
                      : game.phase === 'ready'
                        ? 'Start stacking ↗'
                        : 'Try again ↗'}
                  </Button>
                  {game.paused ? (
                    <Button block onClick={start}>
                      Start a new run
                    </Button>
                  ) : (
                    <button type="button" className={styles.textButton} onClick={showHelp}>
                      How it works
                    </button>
                  )}
                </motion.div>
              </div>
            )}
            <span className={styles.stageCaption} aria-hidden="true">
              FORM / BALANCE / TIMING
            </span>
          </section>
          <aside className={styles.sidebar}>
            <section className={styles.ruleCard}>
              <span className={styles.eyebrow}>LESS IS MORE</span>
              <h2>
                Stay in
                <br />
                the overlap.
              </h2>
              <div className={styles.blockDiagram} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <p>
                Anything hanging over the edge gets sliced away. Your next block inherits what’s
                left.
              </p>
              <div className={styles.axis}>
                <span>NEXT DIRECTION</span>
                <strong>{game.axis === 'x' ? '↙ Across' : '↘ Along'}</strong>
              </div>
            </section>
            <section className={styles.streakCard}>
              <div className={styles.cardTitle}>
                <span className={styles.eyebrow}>PERFECT STREAK</span>
                <b>{game.streak}</b>
              </div>
              <div
                className={styles.streakDots}
                aria-label={`${game.streak % 3} of 3 perfect placements toward width recovery`}
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < game.streak % 3 ? styles.filled : undefined} />
                ))}
              </div>
              <p>
                Three perfect placements in a row restore a little width. A small reward for finding
                your rhythm.
              </p>
            </section>
            <section className={styles.controls}>
              <span className={styles.eyebrow}>MAKE YOUR MOVE</span>
              <div>
                <kbd>Space</kbd>
                <span>or tap the play area</span>
              </div>
              <div>
                <kbd>Esc</kbd>
                <span>pause your run</span>
              </div>
              <small>Focus the course to use keyboard controls.</small>
            </section>
            <div className={styles.options}>
              <Button onClick={showHelp}>How to play</Button>
              <Button
                aria-pressed={sound}
                onClick={() => {
                  if (!sound) {
                    try {
                      audio.current ??= new AudioContext();
                      void audio.current.resume();
                    } catch {
                      /* Optional audio. */
                    }
                  }
                  setSound(!sound);
                }}
              >
                Sound {sound ? 'on' : 'off'}
              </Button>
            </div>
            <p className={styles.local}>Your best stays on this device.</p>
          </aside>
        </div>
        <Modal
          title="A little timing goes a long way"
          open={help}
          onCancel={() => setHelp(false)}
          footer={
            <Button type="primary" onClick={() => setHelp(false)}>
              Got it
            </Button>
          }
        >
          <p>
            Tap or click the play area when the moving block aligns with the tower. You can also
            focus the course and press Space or Enter. Each successful placement adds one layer.
          </p>
          <p>
            Overhang is trimmed away. Movement alternates between two directions. Missing the tower
            completely ends your run.
          </p>
          <p>
            Very close placements snap into alignment. Every third consecutive perfect placement
            restores a little width along the current direction, up to the starting size.
          </p>
          <p>
            Escape pauses. Leaving the tab also pauses your run. Best scores and sound preferences
            are saved locally; reloading starts a fresh run.
          </p>
        </Modal>
      </main>
    </ConfigProvider>
  );
}
