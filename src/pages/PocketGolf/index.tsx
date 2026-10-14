import { Link } from '@umijs/max';
import { Button, ConfigProvider, Modal, Slider, theme } from 'antd';
import { motion, useReducedMotion } from 'framer-motion';
import React, { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { coursePar, holes } from './course';
import { GolfGame } from './game';
import styles from './styles.less';

const GolfScene = lazy(() => import('./GolfScene'));
const relative = (value: number) =>
  value === 0 ? 'Even' : value > 0 ? `+${value}` : String(value);
function result(strokes: number, par: number) {
  if (strokes === 1) return 'Hole in one!';
  const difference = strokes - par;
  return difference <= -2
    ? 'Eagle!'
    : difference === -1
      ? 'Birdie!'
      : difference === 0
        ? 'On par.'
        : difference === 1
          ? 'Bogey'
          : `${strokes} strokes`;
}
export default function PocketGolf() {
  const [game] = useState(() => new GolfGame());
  const [, redraw] = useReducer((n) => n + 1, 0);
  const [scorecard, setScorecard] = useState(false);
  const [help, setHelp] = useState(false);
  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem('pocket-golf.sound.v1') === 'on';
    } catch {
      return false;
    }
  });
  const audio = useRef<AudioContext>();
  const panel = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const focusCourse = () =>
    window.requestAnimationFrame(() =>
      panel.current
        ?.querySelector<HTMLElement>('[aria-label^="Mini golf course"]')
        ?.focus({ preventScroll: true }),
    );
  useEffect(() => {
    game.onChange = redraw;
    const hidden = () => {
      if (document.hidden && !game.paused && game.phase !== 'start' && game.phase !== 'finished')
        game.pause();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      game.onChange = () => {};
      document.removeEventListener('visibilitychange', hidden);
      void audio.current?.close();
      audio.current = undefined;
    };
  }, [game]);
  useEffect(() => {
    game.onSound = (kind) => {
      if (!sound) return;
      try {
        const ctx = audio.current ?? new AudioContext();
        audio.current = ctx;
        void ctx.resume();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        const frequency = kind === 'cup' ? 660 : kind === 'water' ? 140 : 330;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(kind === 'cup' ? 990 : 70, now + 0.18);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        oscillator.start(now);
        oscillator.stop(now + 0.26);
      } catch {
        /* Audio is optional. */
      }
    };
    return () => {
      game.onSound = () => {};
    };
  }, [game, sound]);
  const openHelp = () => {
    if (!game.paused && game.phase !== 'start' && game.phase !== 'finished') game.pause();
    setHelp(true);
  };
  const total = game.scores.reduce((a, b) => a + b, 0);
  const playing = game.phase !== 'start' && game.phase !== 'finished';
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { colorPrimary: '#35654d', borderRadius: 12, fontFamily: 'inherit' },
      }}
    >
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>THE LITTLE GARDEN CLUB</span>
            <h1>
              Pocket Mini Golf<span> ⛳</span>
            </h1>
            <p>A little fresh air. Six holes. One good putt at a time.</p>
          </div>
          <Link to="/" className={styles.back}>
            ← Return to tools
          </Link>
        </header>
        <div className={styles.layout}>
          <section className={styles.playArea} ref={panel} aria-label="Pocket Mini Golf game">
            <div className={styles.toolbar}>
              <div>
                <span className={styles.holeBadge}>{String(game.index + 1).padStart(2, '0')}</span>
                <div>
                  <small>
                    HOLE {game.index + 1} OF {holes.length}
                  </small>
                  <strong>{game.hole.name}</strong>
                </div>
              </div>
              <div className={styles.metrics}>
                <span>
                  PAR <b>{game.hole.par}</b>
                </span>
                <span>
                  STROKES <b>{game.strokes}</b>
                </span>
              </div>
            </div>
            <div className={styles.viewport}>
              <Suspense fallback={<div className={styles.loading}>Opening the garden…</div>}>
                <GolfScene game={game} />
              </Suspense>
              <div className={styles.courseLabel} aria-hidden="true">
                GARDEN COURSE <span> / EST. 2026</span>
              </div>
              {(game.phase === 'start' ||
                game.phase === 'finished' ||
                game.phase === 'holed' ||
                game.paused) && (
                <div className={styles.overlay}>
                  <motion.div
                    key={`${game.phase}-${game.paused}`}
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.overlayCard}
                  >
                    {game.phase === 'start' ? (
                      <>
                        <span className={styles.flag}>⚑</span>
                        <span className={styles.eyebrow}>YOUR NEXT LITTLE ESCAPE</span>
                        <h2>
                          Make time
                          <br />
                          for a round.
                        </h2>
                        <p>
                          Six handcrafted holes in a pocket-sized garden. Aim, roll, and find your
                          way to the flag.
                        </p>
                        <div className={styles.roundFacts}>
                          <span>6 holes</span>
                          <span>Par {coursePar}</span>
                          <span>5–10 min</span>
                        </div>
                        {game.saved && (
                          <Button
                            type="primary"
                            size="large"
                            block
                            onClick={() => {
                              game.start(true);
                              focusCourse();
                            }}
                          >
                            Resume hole {game.saved.index + 1}
                          </Button>
                        )}
                        <Button
                          type={game.saved ? 'default' : 'primary'}
                          size="large"
                          block
                          onClick={() => {
                            game.start();
                            focusCourse();
                          }}
                        >
                          Play a new round ↗
                        </Button>
                        <button type="button" className={styles.textButton} onClick={openHelp}>
                          First visit? How to play
                        </button>
                        {game.best !== null && <small>Personal best · {game.best} strokes</small>}
                      </>
                    ) : game.phase === 'finished' ? (
                      <>
                        <span className={styles.flag}>⚑</span>
                        <span className={styles.eyebrow}>
                          {game.practice ? 'PRACTICE COMPLETE' : 'ROUND COMPLETE'}
                        </span>
                        <h2>A lovely round.</h2>
                        <p>{game.notice || 'Thanks for spending a little time in the garden.'}</p>
                        <div className={styles.finishScore}>
                          <b>{total}</b>
                          <span>strokes · {relative(total - coursePar)} to par</span>
                        </div>
                        <Button
                          type="primary"
                          size="large"
                          block
                          onClick={() => {
                            game.start();
                            focusCourse();
                          }}
                        >
                          Play again
                        </Button>
                        <Button block onClick={() => setScorecard(true)}>
                          View scorecard
                        </Button>
                      </>
                    ) : game.paused ? (
                      <>
                        <span className={styles.eyebrow}>TAKE YOUR TIME</span>
                        <h2>A little breather.</h2>
                        <p>Your round is paused.</p>
                        <Button
                          type="primary"
                          size="large"
                          block
                          onClick={() => {
                            game.pause();
                            focusCourse();
                          }}
                        >
                          Resume round
                        </Button>
                        <Button
                          block
                          onClick={() => {
                            game.restart();
                            focusCourse();
                          }}
                        >
                          Restart hole · practice
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className={styles.flag}>⚑</span>
                        <span className={styles.eyebrow}>HOLE {game.index + 1} COMPLETE</span>
                        <h2>{result(game.strokes, game.hole.par)}</h2>
                        <p>
                          {game.strokes} strokes · Par {game.hole.par}
                        </p>
                        <Button
                          type="primary"
                          size="large"
                          block
                          onClick={() => {
                            game.next();
                            focusCourse();
                          }}
                        >
                          {game.index === holes.length - 1 ? 'Finish round' : 'Next hole →'}
                        </Button>
                      </>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
            <div className={styles.bottomBar}>
              <p role="status" aria-live="polite">
                {game.notice ||
                  (game.phase === 'rolling'
                    ? 'Ball rolling…'
                    : game.phase === 'ready'
                      ? game.hole.hint
                      : 'Find your line. Enjoy the roll.')}
              </p>
              <Button
                disabled={!playing}
                onClick={() => {
                  game.pause();
                  focusCourse();
                }}
              >
                {game.paused ? 'Resume' : 'Pause'}
              </Button>
            </div>
          </section>
          <aside className={styles.sidebar}>
            <section className={styles.controlCard}>
              <span className={styles.eyebrow}>THE PUTTING DESK</span>
              <h2>Find your line.</h2>
              <p>Pull back from the ball, then release. A longer pull makes a stronger putt.</p>
              <div className={styles.powerLabel}>
                <label htmlFor="golf-power">Shot power</label>
                <b>{Math.round(game.power * 100)}%</b>
              </div>
              <Slider
                id="golf-power"
                aria-label="Shot power"
                min={3}
                max={100}
                value={Math.max(3, Math.round(game.power * 100))}
                disabled={game.phase !== 'ready' || game.paused}
                onChange={(value) => {
                  game.power = value / 100;
                  game.aiming = true;
                  game.notify();
                }}
              />
              <div className={styles.aimButtons}>
                <Button
                  disabled={game.phase !== 'ready' || game.paused}
                  aria-label="Aim left"
                  onClick={() => {
                    game.angle -= 0.08;
                    game.aiming = true;
                    game.notify();
                  }}
                >
                  ↶ Aim
                </Button>
                <Button
                  disabled={game.phase !== 'ready' || game.paused}
                  aria-label="Aim right"
                  onClick={() => {
                    game.angle += 0.08;
                    game.aiming = true;
                    game.notify();
                  }}
                >
                  Aim ↷
                </Button>
              </div>
              <Button
                size="large"
                type="primary"
                block
                disabled={game.phase !== 'ready' || game.paused}
                onClick={() => {
                  game.shoot();
                  focusCourse();
                }}
              >
                Putt →
              </Button>
              <div className={styles.keyboard}>
                <span>
                  <kbd>←</kbd>
                  <kbd>→</kbd> Aim
                </span>
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> Power
                </span>
                <span>
                  <kbd>Space</kbd> Putt
                </span>
              </div>
              <small>
                Click or focus the course to use keyboard controls. Hold Shift for finer aim.
              </small>
            </section>
            <section className={styles.scoreCard}>
              <div className={styles.sectionHeading}>
                <span className={styles.eyebrow}>YOUR ROUND</span>
                <span>{game.practice ? 'Practice' : `Par ${coursePar}`}</span>
              </div>
              <ol>
                {holes.map((hole, i) => (
                  <li key={hole.name} className={i === game.index ? styles.currentHole : undefined}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{hole.name}</strong>
                      <small>Par {hole.par}</small>
                    </div>
                    <b>
                      {game.scores[i] ??
                        (i === game.index && game.phase === 'holed' ? game.strokes : '—')}
                    </b>
                  </li>
                ))}
              </ol>
              <div className={styles.total}>
                <span>Completed holes</span>
                <b>
                  {total}
                  {game.phase === 'holed' ? ` + ${game.strokes}` : ''} <small>strokes</small>
                </b>
              </div>
            </section>
            <div className={styles.options}>
              <Button onClick={openHelp}>How to play</Button>
              <Button
                aria-pressed={sound}
                onClick={() => {
                  if (!sound) {
                    try {
                      audio.current ??= new AudioContext();
                      void audio.current.resume();
                    } catch {
                      /* optional */
                    }
                  }
                  setSound(!sound);
                }}
              >
                Sound {sound ? 'on' : 'off'}
              </Button>
            </div>
            <p className={styles.localNote}>Progress and best scores stay on this device.</p>
          </aside>
        </div>
        <Modal
          title="A quick guide to the garden"
          open={help}
          onCancel={() => setHelp(false)}
          footer={
            <Button type="primary" onClick={() => setHelp(false)}>
              Got it
            </Button>
          }
        >
          <p>
            Select the ball, drag backward to set direction and power, then release. Return the
            pointer to the ball or press Escape to cancel.
          </p>
          <p>
            For keyboard play, focus the course. Use left/right arrows to aim, up/down for power,
            and Space to putt. Hold Shift for finer aim. Escape pauses.
          </p>
          <p>
            Bank off the stone borders. The ball must slow down to drop into the cup. Water adds one
            penalty stroke and returns you to your previous position.
          </p>
          <p>
            Restarting a hole makes the round a practice round. Practice scores cannot replace your
            personal best. Leaving mid-shot restores the position before that shot.
          </p>
        </Modal>
        <Modal
          title="Your garden scorecard"
          open={scorecard}
          footer={null}
          onCancel={() => setScorecard(false)}
        >
          <table className={styles.scoreTable}>
            <thead>
              <tr>
                <th>Hole</th>
                <th>Par</th>
                <th>Strokes</th>
              </tr>
            </thead>
            <tbody>
              {holes.map((hole, i) => (
                <tr key={hole.name}>
                  <td>
                    {i + 1}. {hole.name}
                  </td>
                  <td>{hole.par}</td>
                  <td>{game.scores[i] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <td>{coursePar}</td>
                <td>{total}</td>
              </tr>
            </tfoot>
          </table>
        </Modal>
      </main>
    </ConfigProvider>
  );
}
