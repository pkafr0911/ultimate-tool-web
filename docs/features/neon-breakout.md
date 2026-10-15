# Neon Breakout

Route: `/game/neon-breakout` (GitHub Pages: `/ultimate-tool-web/game/neon-breakout`). Appears in Games and the existing homepage tool registry.

## Controls and rules

Mouse movement directly sets the paddle target without easing. Touch dragging is relative, so the finger can stay below the ball. Focus the arena to use arrows or A/D, Space to launch, and Escape to pause. Clicking/tapping also launches. Hidden tabs pause and require explicit resume.

Six campaign levels introduce one-hit standard bricks, two-hit armored bricks, explosive neighbor damage, and indestructible barriers. Clear every destructible brick to advance. Damage earns 10 points; destruction earns 100 times the current combo (capped at 5). The combo counts consecutive destructions before a paddle bounce, independently for each ball.

Selected bricks drop a wide paddle (12 seconds), slow ball (10 seconds), or multiball (up to three balls). Repeated timed effects refresh duration. All balls must be lost before a life is deducted. Three lives per campaign; remaining lives carry between levels. Progress checkpoints save the start of each level. Best score and sound preference persist separately. Storage failure does not block play.

## Architecture and tradeoffs

- `model.ts`: level definitions, pure swept rectangle collision helper, fixed 120 Hz simulation, moving-paddle contact, bounded speed, shallow-angle correction, recursive explosion damage, power-ups, and versioned checkpoints.
- `Scene.tsx`: lazy Three.js scene, nearly overhead orthographic camera, shared procedural geometry, emissive materials, brick markings, pooled particles, and optional synthesized sound.
- `index.tsx` / `styles.less`: scoped arcade UI, score/lives, power timers, campaign progression, accessible menus and controls.
- `model.test.ts`: gameplay regression tests.

Ball collision uses radius-expanded rectangles, so brick corners are conservative square boundaries rather than exact rounded-circle contacts. Up to eight contacts are resolved in each simulation step. Paddle collisions use relative motion and the paddle position at impact, not only its final position. Simulation catches up by at most 100 ms to avoid giant jumps after stalls.

No new dependencies, external models, postprocessing, or shadow maps. DPR is capped at 1.5; the particle pool contains 100 pieces. Reduced motion disables particles and UI transitions while preserving essential gameplay. WebGL failure has a readable fallback. Renderer resources, event listeners, audio, observer, and animation loop are disposed on route exit.

## Verification

Run `npm run test:neon-breakout`, `npm run tsc`, `npx eslint src/pages/NeonBreakout --ext .ts,.tsx`, and `npm run build-pre`.

Tests cover swept impacts, level data, armored/barrier behavior, explosion recursion, paddle angles and motion at impact, multiball life handling, timed power-ups, pause, launch synchronization, checkpoint/best-score handling, campaign completion, refresh-rate consistency, and storage denial.

Visual browser testing was unavailable due to the existing session browser security restriction. Desktop/mobile framing, touchscreen feel, site themes, sound, and campaign difficulty still need hands-on playtesting.
