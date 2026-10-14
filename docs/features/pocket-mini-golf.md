# Pocket Mini Golf

Route: `/game/pocket-mini-golf` (production: `/ultimate-tool-web/game/pocket-mini-golf`). Registered in the existing game menu and tool registry; the homepage discovers it automatically.

## Playing

Six garden holes, par 19. Select the ball and pull backward to aim and set power; release to putt. Returning the pointer to the ball cancels a shot. Focus the course to use left/right for direction, up/down for power, Space to putt, and Escape to cancel aiming or pause. Shift gives finer angular adjustments. The side panel also provides aim buttons, a power slider, and a Putt button.

A fast ball can pass over the cup. Water costs the shot plus one penalty and restores the previous position. Restarting a hole turns the round into practice; practice cannot replace the best score. Progress, best score, and sound preference are stored locally. Interrupted shots restore their pre-shot state. Hidden tabs pause and require explicit resume.

## Implementation

- `course.ts`: six data-driven layouts, par, hints, walls, ponds, moving gate.
- `physics.ts`: planar simulation at 120 Hz, swept radius-expanded box collisions, energy loss, rolling friction, cup capture, and first-impact aim guide. Box corners use a conservative square expansion rather than exact rounded collision boundaries.
- `game.ts`: game states, scores, recovery, pause, and validated versioned persistence. Storage failures do not block play.
- `GolfScene.tsx`: lazy Three.js renderer; orthographic camera at 45° azimuth and approximately 50° elevation. Projected course bounds determine responsive framing. The camera stays fixed for play. Shared procedural geometry, limited DPR (1.6), one 1024px shadow map, no external assets or postprocessing. GPU resources, observer, events, and animation loop are cleaned up on unmount.
- `index.tsx` / `styles.less`: scoped garden interface, accessible controls, reduced-motion overlay entrances, scorecard, help, and optional synthesized audio.

There are no ramps, jumps, free-camera controls, accounts, or external services in this version. Hole changes use immediate camera framing; motion is reserved for the ball, gate, and short UI entrances. Scene colors are independent of the site's artwork. No shared theme changes are included.

## Verification

Run `npm run test:pocket-golf`, `npm run tsc`, and `npm run build-pre`. Lint with `npx eslint src/pages/PocketGolf --ext .ts,.tsx`.

Automated tests cover swept collisions, boundary containment at maximum shot power, settling, cup speed limits, a direct first-hole putt, aim guide clipping, ball-width course reachability, water scoring, pause, interrupted-shot restoration, practice/best scores, malformed saves, and unavailable storage.

Manual visual and interaction verification remains necessary: the browser security policy in this session prevented local preview access. In particular, check touch aiming on a phone, keyboard focus, desktop/portrait framing, both site themes, WebGL fallback, and audio on the target browsers. Course par values are initial design targets and need human playtesting.
