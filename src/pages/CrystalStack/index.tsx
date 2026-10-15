import { Link } from '@umijs/max';
import { Button, ConfigProvider, Modal, theme } from 'antd';
import React, { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { index, landing, shapes, StackGame, viewMove, worldCells } from './model';
import styles from './styles.less';
const Scene = lazy(() => import('./Scene'));
const Classic = lazy(() => import('./classic'));
function Preview({ id }: { id: number | null }) {
  if (id === null) return <span className={styles.empty}>Empty</span>;
  const shape = shapes[id];
  return (
    <svg viewBox="0 0 90 65" role="img" aria-label={shape.name} className={styles.preview}>
      {shape.cells.map(([x, , z], i) => (
        <rect
          key={i}
          x={34 + x * 20}
          y={13 + z * 20}
          width="17"
          height="17"
          rx="3"
          fill={shape.color}
        />
      ))}
    </svg>
  );
}
function SpatialStack() {
  const [game] = useState(() => new StackGame());
  const [, redraw] = useReducer((n) => n + 1, 0);
  const [help, setHelp] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const focus = () =>
    requestAnimationFrame(() =>
      host.current
        ?.querySelector<HTMLElement>('[aria-label^="3D block well"]')
        ?.focus({ preventScroll: true }),
    );
  const action = (fn: () => void) => {
    fn();
    focus();
  };
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
  const playing = ['playing', 'clearing'].includes(game.phase);
  const ghost = game.active ? worldCells(landing(game.board, game.active)) : [];
  const layer = ghost.length ? Math.min(...ghost.map((c) => c.y)) : 0;
  const lesson = !game.learned.move
    ? '01 / Move a piece with the arrows or the direction pad.'
    : !game.learned.rotate
      ? '02 / Try a rotation. Q / E turns it; A / D and W / S tip it.'
      : !game.learned.drop
        ? '03 / Follow the white ghost. Press Space or Drop to place.'
        : 'Ready to build. Fill all 25 cells in a horizontal layer to clear it.';
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#9ed9cf', colorBgContainer: '#172635', borderRadius: 10 },
      }}
    >
      <main className={styles.page} ref={host}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>A PUZZLE IN THREE DIMENSIONS</span>
            <h1>
              Crystal Stack<span> / 3D</span>
            </h1>
            <p>Think in layers. Find a little room.</p>
          </div>
          <Link to="/">← Back to tools</Link>
        </header>
        <div className={styles.layout}>
          <section className={styles.chamber}>
            <div className={styles.hud}>
              <div>
                <small>SCORE</small>
                <strong>{game.score}</strong>
              </div>
              <div>
                <small>LAYERS</small>
                <strong>{game.layers}</strong>
              </div>
              <div>
                <small>{game.mode === 'practice' ? 'MODE' : 'LEVEL'}</small>
                <strong>{game.mode === 'practice' ? 'Practice' : game.level}</strong>
              </div>
              <Button disabled={!playing} onClick={() => action(() => game.pause())}>
                {game.paused ? 'Resume' : 'Pause'}
              </Button>
            </div>
            <div className={styles.viewport}>
              <Suspense fallback={<div className={styles.fallback}>Preparing the chamber…</div>}>
                <Scene game={game} />
              </Suspense>
              <div className={styles.viewLabel}>GRID VIEW {game.view + 1} / 4 · DRAG TO ORBIT</div>
              {(!playing || game.paused) && (
                <div className={styles.overlay}>
                  <div className={styles.panel}>
                    <span className={styles.eyebrow}>
                      {game.paused
                        ? 'TAKE YOUR TIME'
                        : game.phase === 'over'
                          ? 'CHAMBER FULL'
                          : 'FIVE BY FIVE. TWELVE LAYERS HIGH.'}
                    </span>
                    <h2>
                      {game.paused ? (
                        'A moment to think.'
                      ) : game.phase === 'over' ? (
                        'A new perspective?'
                      ) : (
                        <>
                          Make room
                          <br />
                          for possibility.
                        </>
                      )}
                    </h2>
                    <p>
                      {game.phase === 'menu'
                        ? 'Move and turn connected cubes. Fill a complete horizontal layer to clear it.'
                        : `${game.score} points · ${game.layers} layers cleared`}
                    </p>
                    {game.paused ? (
                      <Button
                        block
                        type="primary"
                        size="large"
                        onClick={() => action(() => game.pause())}
                      >
                        Resume
                      </Button>
                    ) : (
                      <>
                        <Button
                          block
                          type="primary"
                          size="large"
                          onClick={() => action(() => game.start('practice'))}
                        >
                          Practice · learn at your pace
                        </Button>
                        <Button
                          block
                          size="large"
                          onClick={() => action(() => game.start('endless'))}
                        >
                          Endless · race gravity
                        </Button>
                      </>
                    )}
                    {game.paused && (
                      <div>
                        <Button block onClick={() => action(() => game.start('practice'))}>
                          New Practice run
                        </Button>
                        <Button block onClick={() => action(() => game.start('endless'))}>
                          New Endless run
                        </Button>
                      </div>
                    )}
                    <small>Endless best · {game.best}</small>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.cameraBar}>
              <Button onClick={() => action(() => game.turn(-1))}>↶ View</Button>
              <span>↑ Far · ↓ Near · ← Left · → Right</span>
              <Button onClick={() => action(() => game.turn(1))}>View ↷</Button>
            </div>
            <div className={styles.cameraTilt}>
              <Button
                onClick={() => action(() => game.orbit(game.cameraYaw, game.cameraPitch + 0.15))}
              >
                Tilt up
              </Button>
              <Button onClick={() => action(() => game.resetCamera())}>Reset view</Button>
              <Button
                onClick={() => action(() => game.orbit(game.cameraYaw, game.cameraPitch - 0.15))}
              >
                Tilt down
              </Button>
            </div>
            <div className={styles.mobileControls}>
              <div>
                {(
                  [
                    [-1, 0, '←'],
                    [0, -1, '↑'],
                    [0, 1, '↓'],
                    [1, 0, '→'],
                  ] as const
                ).map(([x, z, label]) => (
                  <Button
                    key={label}
                    aria-label={`Move ${label}`}
                    disabled={!game.canPlay}
                    onClick={() => action(() => game.move(x, z))}
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  disabled={!game.canPlay || game.holdUsed}
                  onClick={() => action(() => game.hold())}
                >
                  Hold
                </Button>
              </div>
              <div>
                {(['y', 'x', 'z'] as const).map((axis) => (
                  <React.Fragment key={axis}>
                    <Button
                      aria-label={`Rotate ${axis} negative`}
                      disabled={!game.canPlay}
                      onClick={() => action(() => game.rotate(axis, -1))}
                    >
                      {axis.toUpperCase()} ↶
                    </Button>
                    <Button
                      aria-label={`Rotate ${axis} positive`}
                      disabled={!game.canPlay}
                      onClick={() => action(() => game.rotate(axis, 1))}
                    >
                      {axis.toUpperCase()} ↷
                    </Button>
                  </React.Fragment>
                ))}
              </div>
              <Button
                block
                type="primary"
                disabled={!game.canPlay}
                onClick={() => action(() => game.hardDrop())}
              >
                Drop piece
              </Button>
            </div>
          </section>
          <aside className={styles.sidebar}>
            <section className={styles.card}>
              <div className={styles.cardHeading}>
                <span className={styles.eyebrow}>LANDING LAYER {layer + 1}</span>
                <span>TOP VIEW</span>
              </div>
              <div
                className={styles.map}
                role="img"
                aria-label={`Top view of landing layer ${layer + 1}; outlines show the ghost footprint`}
              >
                {Array.from({ length: 25 }, (_, i) => {
                  const p = viewMove((i % 5) - 2, Math.floor(i / 5) - 2, game.view);
                  const x = p.x + 2,
                    z = p.z + 2,
                    id = game.board[index(x, layer, z)];
                  const projected = ghost.some((c) => c.x === x && c.z === z && c.y === layer);
                  return (
                    <span
                      key={i}
                      className={projected ? styles.ghostCell : undefined}
                      style={{ background: id ? shapes[id - 1].color : undefined }}
                    />
                  );
                })}
              </div>
              <p>
                Filled cells are settled blocks. White outlines show where the lowest cubes of your
                piece will land.
              </p>
            </section>
            <section className={styles.card}>
              <span className={styles.eyebrow}>NEXT IN LINE</span>
              <div className={styles.previews}>
                {game.queue.length ? (
                  game.queue.map((id, i) => (
                    <div key={i}>
                      <Preview id={id} />
                      <small>{shapes[id].name}</small>
                    </div>
                  ))
                ) : (
                  <p>Start a mode to reveal the next pieces.</p>
                )}
              </div>
              <div className={styles.hold}>
                <Preview id={game.held} />
                <Button
                  disabled={!game.canPlay || game.holdUsed}
                  onClick={() => action(() => game.hold())}
                >
                  Hold / swap · C
                </Button>
              </div>
            </section>
            <section className={`${styles.card} ${styles.desktopControls}`}>
              <span className={styles.eyebrow}>PLACE WITH INTENTION</span>
              <div className={styles.pad}>
                <Button
                  disabled={!game.canPlay}
                  onClick={() => action(() => game.move(0, -1))}
                  aria-label="Move farther"
                >
                  ↑
                </Button>
                <div>
                  <Button
                    disabled={!game.canPlay}
                    onClick={() => action(() => game.move(-1, 0))}
                    aria-label="Move left"
                  >
                    ←
                  </Button>
                  <Button
                    disabled={!game.canPlay}
                    onClick={() => action(() => game.move(0, 1))}
                    aria-label="Move nearer"
                  >
                    ↓
                  </Button>
                  <Button
                    disabled={!game.canPlay}
                    onClick={() => action(() => game.move(1, 0))}
                    aria-label="Move right"
                  >
                    →
                  </Button>
                </div>
              </div>
              <div className={styles.rotations}>
                {(['y', 'x', 'z'] as const).map((axis, i) => (
                  <div key={axis}>
                    <span>{['Turn · Q / E', 'Tip X · A / D', 'Tip Z · W / S'][i]}</span>
                    <Button
                      disabled={!game.canPlay}
                      aria-label={`Rotate ${axis} negative`}
                      onClick={() => action(() => game.rotate(axis, -1))}
                    >
                      ↶
                    </Button>
                    <Button
                      disabled={!game.canPlay}
                      aria-label={`Rotate ${axis} positive`}
                      onClick={() => action(() => game.rotate(axis, 1))}
                    >
                      ↷
                    </Button>
                  </div>
                ))}
              </div>
              <Button block disabled={!game.canPlay} onClick={() => action(() => game.lower())}>
                Lower one cell
              </Button>
              <Button
                block
                type="primary"
                size="large"
                disabled={!game.canPlay}
                onClick={() => action(() => game.hardDrop())}
              >
                Drop piece · Space
              </Button>
            </section>
            <div className={styles.lesson} role="status">
              {game.mode === 'practice'
                ? lesson
                : 'Hold Shift to fall faster. Complete five layers to increase the level.'}
            </div>
            <Button
              onClick={() => {
                if (playing && !game.paused) game.pause();
                setHelp(true);
              }}
            >
              Controls & rules
            </Button>
          </aside>
        </div>
        <Modal
          open={help}
          title="Think in layers"
          onCancel={() => setHelp(false)}
          footer={<Button onClick={() => setHelp(false)}>Got it</Button>}
        >
          <p>
            Fill all 25 cells of a horizontal layer. Complete layers disappear and everything above
            shifts down. The white landing ghost shows the lowest valid drop position. The top-view
            map matches the current camera orientation.
          </p>
          <p>
            Arrows move relative to the view. Q/E rotate around vertical Y; A/D rotate around world
            X; W/S rotate around world Z. Space hard-drops and locks. C holds or swaps once per
            piece. Escape pauses. Drag in any direction to orbit the camera. Press [ / ] for quarter
            turns; use Tilt and Reset view to adjust elevation or restore the original view.
            Movement and the top-view map follow the nearest grid view, shown above the camera
            controls.
          </p>
          <p>
            Practice has no gravity or automatic locking. Follow its three prompts to learn
            movement, rotation, and dropping. Endless speeds up every five layers. Hold Shift to
            soft-drop. After a piece touches down, you have half a second to adjust it; at most ten
            adjustments reset that timer.
          </p>
          <p>
            Green outlines highlight the most-filled layer. Blocks toward the camera fade to reveal
            the ghost. The run ends when the next piece cannot spawn. Endless best scores save
            locally; active runs are not saved.
          </p>
        </Modal>
      </main>
    </ConfigProvider>
  );
}

export default function CrystalStack() {
  const [mode, setMode] = useState<'spatial' | 'classic'>('spatial');
  return (
    <>
      <div className={styles.modePicker} aria-label="Game mode">
        <button type="button" aria-pressed={mode === 'spatial'} onClick={() => setMode('spatial')}>
          Crystal Stack · 3D well
        </button>
        <button type="button" aria-pressed={mode === 'classic'} onClick={() => setMode('classic')}>
          Classic · 2D board
        </button>
        <span>Switching modes ends the current run.</span>
      </div>
      {mode === 'spatial' ? (
        <SpatialStack />
      ) : (
        <Suspense fallback={<p>Preparing Classic mode…</p>}>
          <Classic />
        </Suspense>
      )}
    </>
  );
}
