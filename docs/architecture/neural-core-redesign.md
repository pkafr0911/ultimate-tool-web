# Neural Core homepage redesign

The existing UmiJS/React homepage now has an interactive Three.js hero and a complete searchable tool directory. The original `src/constants.tsx` registry and `Welcome/constants.ts` categories remain unchanged: 44 entries across seven categories, including entries that share a route. Tool pages, routes, global navigation, and deployment configuration are unchanged.

## Files

- `src/pages/Welcome/index.tsx`: homepage composition, discovery immediately after hero, Framer reduced-motion configuration; native scrolling replaces Lenis.
- `src/pages/Welcome/components/HeroSection.tsx`: original title, five taglines, CTA destinations, badges and featured tool links; lazy scene loading.
- `src/pages/Welcome/components/NeuralCore.tsx`: reusable procedural WebGL scene, keyframe mixer, layered geometry/orbits/filaments/particles, camera reveal, pointer and scroll influence, energy pulse, pause button, static CSS fallback.
- `src/pages/Welcome/components/CategoryShowcaseSection.tsx`: all tools rendered from original sources, search, category filters, accessible links, category descriptions/features and expandable original testimonials.
- `src/pages/Welcome/discovery.ts` and `discovery.test.ts`: typed filtering and four registry-backed regression tests.
- `src/pages/Welcome/neural.less`: responsive hero and directory, light/dark palettes, focus states, narrow-screen header search fix scoped to the homepage.
- `src/pages/Welcome/styles.less`: compact styling for retained supporting homepage sections.
- `FeatureHighlightSection.tsx`, `HorizontalShowcase.tsx`, `Marquee.tsx`, `VelocityText.tsx`, and `ScrollTextReveal.tsx` under the homepage components folder: retained content, compact capability cards, browsable tool rows and reduced distracting motion.
- `src/pages/Welcome/themeFixes.ts` and `src/hooks/useDarkMode.tsx`: supported DarkReader fixes scoped to the homepage, preserving its authored dark colors through the existing theme switch.

## Design and performance

Near-black #080B14, cyan and ultraviolet accents, fine grid texture, spacious typography and subtle card gradients. The core occupies its own column; mobile stacks it below the readable hero. Tool cards keep complete descriptions. Existing lower-page content remains accessible.

Three.js is dynamically imported with the scene. It uses procedural geometry, standard/physical materials and no external models, textures, bloom, shadows or postprocessing. Pixel ratio is capped at 1.75 (1.25 on mobile); mobile reduces geometry detail and particles. The animation loop stops when paused, outside the viewport or in a hidden tab. Reduced motion renders a static scene. ResizeObserver, IntersectionObserver, listeners, animation frames, mixer bindings, geometries, materials and the renderer are cleaned up on unmount. WebGL creation failure or context loss shows the CSS core fallback.

The tradeoff is softer detail on high-DPI screens and less glow than a postprocessed scene, in exchange for lower rendering cost. Shared Three.js dependency chunks still add download cost; no new dependencies were installed.

## Verification

- `npm run build-pre`: PASS. Production assets use `/ultimate-tool-web/`.
- `npx tsx src/pages/Welcome/discovery.test.ts`: PASS, four tests: complete original registry, name/description/category search, combined filters/empty results, and automatic inclusion of new entries beyond six items.
- ESLint on changed TypeScript implementation files: PASS.
- Prettier on all changed source files: PASS.
- `git diff --check`: PASS.
- Browser checks against the production build: desktop light/dark, mobile at 390 × 844, all 44 entries, case-insensitive search, combined empty results, reset to 44 tools, Enter-key navigation to the existing UUID tool under the deployment subpath, scene pause/resume state. Final mobile document width equals viewport width (375 CSS pixels excluding scrollbar).
- WebGL rendering verified in browser. Reduced-motion and resource cleanup paths reviewed in code; GPU performance has not been benchmarked across physical devices.
- `npm run tsc`: BLOCKED by three errors in untouched tool files: missing `Tool` export in `PicsEditor/utils/layerHelpers.ts:3`; unsupported `rightTop` dropdown placements in `VectorEditor/components/Toolbar.tsx:234` and `:243`. No errors reported in changed files.
- `npm run test -- --runInBand --passWithNoTests`: existing Jest configuration fails while parsing `config/config.ts`; `jest.config.ts` also references absent `tests/setupTests.jsx`. The focused Node test suite above was run independently.

No deployment, commit or push was performed.
