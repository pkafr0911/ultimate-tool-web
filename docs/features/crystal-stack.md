# Crystal Stack 3D

Route: `/game/crystal-stack`; production subpath: `/ultimate-tool-web/game/crystal-stack`. Registered in Games and the original dynamic tool catalog.

## Play

The chamber is 5 × 5 × 12. Pieces are selected from shuffled bags of five shapes: three-cube Line and Corner, and four-cube Square, Tee, and Zigzag. Fill all 25 cells of a horizontal layer to clear it; higher layers compact downward. Spawn obstruction ends the run.

Practice has no gravity or automatic locking, with three action-driven learning prompts. Endless increases gravity every five cleared layers, has a 500 ms contact lock delay, and allows at most ten grounded adjustments to reset that timer. Layer scores are 100/300/500/800 for one/two/three/four layers, multiplied by level. Endless hard drops award two points per cell and soft drops one. Practice does not replace the Endless best. Pausing offers new runs in either mode. Only the Endless best persists; runs and settings reset on reload.

Controls:

- Arrows: camera-relative movement, with 220 ms initial repeat delay and 90 ms repeat interval.
- Q/E: rotate around vertical world Y; A/D: world X; W/S: world Z.
- Space: hard drop and lock; C: hold/swap once per piece.
- Shift: soft fall in Endless, one-cell lowering in Practice.
- Escape: pause; [ / ]: quarter turns. Drag horizontally and vertically to orbit freely. Tilt buttons adjust elevation; Reset view restores the default camera.
- Touch buttons provide movement, both directions of all three rotations, hold, hard drop, free orbit, tilt, and view reset next to the chamber.

## Visibility and architecture

`model.ts` owns a 300-cell integer board, exact grid rotations, small deterministic wall adjustments, collision checks, landing projection, bag generation, hold, gravity, lock delay, scoring, and layer compaction.

`Scene.tsx` renders an orthographic chamber with shared cube geometry, instanced settled blocks, wireframe landing ghosts, and a highlighted most-filled layer. Camera-side blocks above the ghost fade using a simple visibility heuristic. The matching top-down landing map gives an unoccluded lowest-layer occupancy view. Rotations stay in world coordinates while movement and the top-view map follow the nearest camera quadrant. Free orbit is pointer-driven with no inertia; elevation stays between 25° and 75° to prevent inverted or underside views. Camera changes are immediate for predictable input and reduced motion.

`index.tsx` and `styles.less` provide the scoped slate/glass interface, next-three and hold previews, modes, tutorial prompts, controls, score, and help. Three.js is lazy-loaded. No external assets, physics library, postprocessing, or new dependencies. DPR is capped at 1.5 and cube counts are bounded by the board size. WebGL failure has an accessible fallback. Resources and listeners are disposed on unmount. Hidden tabs pause and require explicit resume.

## Verification

Run `npm run test:crystal-stack`, `npm run tsc`, `npx eslint src/pages/CrystalStack --ext .ts,.tsx`, and `npm run build-pre`.

Automated tests cover exact rotations, boundaries, collision, ghost grounding, simultaneous layer compaction, bags, hold restrictions, wall adjustments, rejected rotations, Practice behavior, pause, lock-reset limits, top-out, camera mapping, free orbit, tilt limits, camera reset, best scores, and denied storage.

Browser visual/interaction testing remains unavailable under this session's browser security restriction. Human playtesting should verify depth readability, mobile control fit, all four views, rotation intuition, both site themes, and Endless difficulty. Foreground fading is intentionally a heuristic, not a general occlusion solver.

## Classic / OG-style mode

The selector on the same game page switches between the spatial well and **Classic**, a front-facing 10×20 board with beveled Three.js blocks. Switching modes ends the active run and cleans up that scene. Classic uses all seven tetrominoes, shuffled seven-piece bags, five previews, hold, landing ghost, hard/soft drop, row clearing, and separate best scores per difficulty. This is a classic-rule variant with hold and forgiving wall/floor adjustments, not an exact historical ruleset or an SRS implementation.

| Preset | Starting level | Contact lock delay |
| ------ | -------------- | ------------------ |
| Easy   | 1              | 550 ms             |
| Normal | 5              | 500 ms             |
| Hard   | 10             | 400 ms             |
| Expert | 15             | 300 ms             |

Each ten lines raises the level. Gravity is `max(35ms, 850ms × 0.82^(level−1))`. Up to ten grounded adjustments reset the lock timer. New difficulty selections apply to a new run. Best scores are stored independently under versioned difficulty keys.

Controls: arrows or A/D move, Down/S soft-drops, Up/X rotates clockwise, Z counterclockwise, Space hard-drops, C/Shift holds, and Escape pauses. Touch controls act on pointer-down and support held movement. Keyboard aliases are tracked independently so releasing one of two equivalent keys does not stop the other.

### Input behavior

`classic/model.ts` contains a dedicated input controller. The first press changes state synchronously and requests an immediate WebGL paint through `renderInput`; it does not wait for React state, key-up, or a placement animation. Auto-repeat uses a 130 ms initial delay and 35 ms subsequent interval rather than native keyboard repeat. Hard drop commits and spawns without an entry delay; every spawn is fully visible immediately. Held hard-drop keys cannot drop multiple pieces. Focus loss, tab hiding, and pause clear held inputs. There is no movement easing or postprocessing.

These measures remove intentional application-side input delays. Browser scheduling, GPU workload, keyboard, and display latency remain device-dependent and have not been measured in this session.

Classic code is contained in `src/pages/CrystalStack/classic/`. Run `npm run test:classic-stack` for its regression tests, including immediate input/render requests, held-key behavior, DAS/ARR timing, rotations, multi-row clears, hold, difficulty, pause, spawn visibility, refresh rates, top-out, and storage. Run `npm run test:crystal-stack` for the spatial mode. Shared TypeScript, lint, and production build checks apply to both.
