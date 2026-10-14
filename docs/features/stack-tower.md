# Stack Tower

Route: `/game/stack-tower`; GitHub Pages: `/ultimate-tool-web/game/stack-tower`.

## Play

Click or tap the play area to place a moving block. Focus it to use Space or Enter; Escape pauses. Overhang is trimmed away, directions alternate, and each placement adds one layer. An exact-edge placement with no overlap is a miss. Close placements snap to the tower. Every third consecutive perfect placement restores up to 0.22 world units along the current direction, capped at the original 4-unit footprint. A miss ends the run.

Movement accelerates gradually from 1.8 to a capped 3.6 units/second. Speed is constant within a pass. There is a 0.34-second transition between blocks, which also prevents duplicate placements. Held keyboard events are ignored. Pointer input is attached only to the canvas, so menu buttons cannot place blocks.

Hidden tabs pause and need explicit resume. Best scores are saved on game over; the sound preference is saved when changed. Storage failures do not prevent play. Reloading starts a new run.

## Files and design

- `src/pages/StackTower/model.ts`: pure overlap/trim rules, fixed 120 Hz simulation, game states, capped speed, streaks, scoring, storage.
- `Scene.tsx`: lazy Three.js scene with shared box geometry, instanced tower layers, lightweight falling slices, pastel materials, and orthographic camera. Camera azimuth is 45° and elevation about 34°. It follows between placements, stays steady during movement, and pulls back on a miss.
- `index.tsx`, `styles.less`: scoped ivory/pastel interface, DOM score/results, keyboard help, pause, retry, and optional synthesized sound.
- `model.test.ts`: gameplay regression suite, executed by `npm run test:stack-tower`.

Rendering uses a capped DPR of 1.75, a single 1024px shadow map, no postprocessing, and no external assets or new dependencies. The latest 128 layers and at most eight falling slices are retained. Older layers become a consolidated lower support, with lower height compressed during very long runs. The score retains the full layer count. This is a deliberate bounded-memory tradeoff rather than an exact reconstruction of every historical layer.

Reduced motion keeps the essential moving block but disables falling debris and smooth camera/UI transitions. WebGL creation/context failure produces a readable fallback. The scene disposes geometries, materials, instance buffers, shadow resources, renderer, listeners, observer, and animation loop on unmount.

## Verification

- `npm run test:stack-tower`: trimming in both axes/directions, edge misses, perfect snapping, recovery cap, narrow blocks, input cooldown, streak reset, refresh-rate independence, pause, bounded long runs, restart, best scores, and denied/corrupt storage.
- `npm run tsc`
- `npx eslint src/pages/StackTower --ext .ts,.tsx`
- `npm run build-pre`

The session's browser security restriction prevented visual browser testing. Manually check desktop/mobile framing, tap timing, both site themes, keyboard focus, reduced motion, sound, and WebGL fallback. Difficulty and perfect-timing values are initial tuning choices and need human playtesting.
