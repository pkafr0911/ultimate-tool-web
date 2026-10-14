# Photo editor engineering report

**Date:** 2026-10-14
**Scope:** Existing PhotoEditor route and directly related typing/test configuration. No deployment or remote writes performed.

## Outcome

Stabilized document sizing and serialization, viewport-independent rendering, crop coordinates, asynchronous project loading, history restoration, layer metadata, mask alpha handling, and selected keyboard/pointer workflows. This is not a claim that every advertised or Photoshop-like operation is production-complete; outstanding validation and unsupported functionality are listed below.

## Root causes fixed

- Fabric 6 was paired with Fabric 5 type declarations and callback-style JSON loading in editor workflows. Removed the conflicting type dependency and centralized promise-based document loading.
- History used evictable delta chains and stale React state. It now keeps independent bounded snapshots, serializes synchronously from refs, coalesces related Fabric events, and guards asynchronous restore.
- The canvas viewport and document dimensions were conflated in save, crop, and export paths. A shared document helper now stores dimensions, validates bounds, serializes them, and renders exports with an identity viewport restored in `finally`.
- Crop offsets applied to group-local children and preview coordinates used CSS dimensions as pixels. Crop now translates top-level objects only and previews map CSS pointers to backing pixels.
- Layer identity and editability metadata were not reliably serialized; keyboard and tool actions did not consistently respect locked objects or text-input focus. Custom properties and guards are shared across the relevant workflows.
- Mask application replaced source pixels or alpha instead of preserving image content. It now uses a clip path and combines automatic/manual alpha with a neutral midpoint for Keep behavior.
- Blur Apply depended on preview state. It now recomputes the composition using the current mask and parameters.
- Project writes could report success before transaction commit and project-list instances could remain stale. Storage now resolves on transaction completion and emits a local refresh event.

## Follow-up stabilization (2026-10-14)

- Applied CustomSlider to all nine image adjustments, brush width/opacity/shadow, layer opacity/border thickness, mask tolerance/feather/brush controls, Blur Brush controls, and the existing standalone selection feather control. Preserved ranges, steps, completion callbacks and draggable brush/layer labels; added shared disabled handling, descriptive accessible names, numeric editing, and neutral/color gradients. The standalone selection component remains unmounted. Browser coverage checks adjustment synchronization, layer-opacity undo, zero brush opacity, brush keyboard sizing, locked numeric inputs, mask opacity and Blur Amount controls.

- Restored Camera Raw CustomSlider colors: plain LESS emitted literal `:global(...)` selectors that browsers ignored. The component now uses Ant Design semantic rail/track styles for the gradient, with valid CSS selectors for its appearance. Browser checks cover all three HSL rails, all thirteen grading rails, channel color changes, pointer/keyboard changes, synchronized numeric values, and HSL preview updates.

- Fixed a Fabric 6 failure path: rejected image decoding left `renderOnAddRemove` disabled. The document loader now restores it in `finally`, preserves the existing scene on decode failure, and cancels pending loading during editor teardown.
- Restricted imported top-level JSON to scene fields so project files cannot overwrite viewport or mutable canvas configuration.
- OpenCV blur now releases all allocated native matrices on success and processing/rendering exceptions. Three mocked-native regression cases verify resource ownership; they do not claim OpenCV pixel equivalence.
- Worker posting failures remove pending tasks; worker message-decoding errors reject pending requests and reset the worker. These paths are source-reviewed, not independently fault-injected in the browser.
- Expanded real-browser checks to decode PNG/JPEG/WebP, verify fractional/transparent alpha through mask and blur operations, reject invalid and corrupt projects without losing history, and inspect committed IndexedDB save data.

## Implemented and exercised workflows

- Import a deterministic 320×180 image; verify native dimensions and initialized history.
- Adjust brightness and draw at 200% zoom with pan; verify document-space placement.
- Crop and undo/redo exact document dimensions.
- Export PNG at zoom; decode the download and verify document dimensions and representative adjusted pixels.
- Exercise ten transform transactions, undo/redo the sequence, and verify redo-branch invalidation.
- Export/import editable JSON and retain dimensions, IDs, transforms, and filters.
- Verify persisted locks/visibility/layer order and lock-protected keyboard behavior.
- Ungroup a rotated/scaled fixture and compare restored child world coordinates to within 0.001 px.
- Apply a mask, retain the source image, and verify mask undo/redo serialization.
- Place/edit text at zoom and verify typing shortcuts do not trigger canvas deletion.
- Apply Camera Raw and Blur Brush workflows.

## Changed areas

- PhotoEditor document, rendering, history, import, project, layer, filter, crop, mask, Camera Raw, blur, pointer, and keyboard code under `src/pages/PhotoEditor`.
- Focused unit/integration tests under `src/pages/PhotoEditor/__tests__` and real-browser checks under `tests/photo-editor`.
- Added an isolated Jest configuration and `test:photo-editor` / `test:photo-editor:browser` scripts; removed `@types/fabric` 5 in favor of Fabric 6's bundled declarations and made the existing Puppeteer Core version explicit for browser tests.
- Corrected a moved `Tool` type import in PicsEditor and invalid dropdown placements in VectorEditor so the repository type check can pass.
- Added the audit, test matrix, architecture, and roadmap documents.

## Validation results

| Check | Result |
|---|---|
| `npm run test:photo-editor` | Passed: 3 suites, 21 tests |
| `npm run tsc` | Passed |
| `git diff --check` | Passed |
| `npm run build-pre` (GitHub Pages base configuration) | Passed |
| `EDITOR_URL=http://127.0.0.1:8124/ultimate-tool-web/visual-tools/photo-editor npm run test:photo-editor:browser` | Passed: 22 workflow assertions/log checkpoints; no uncaught page errors |

The focused Jest configuration is used because the repository's default Jest/Umi setup fails before it reaches tests in this environment. The browser suite runs against the production build served under `/ultimate-tool-web/`, with Chrome at DPR 2. The suite includes live Fabric scene checks and decoded raster output checks; it is representative coverage, not a full control-by-control certification.

## Remaining risks and deferred work

- Persistent editing/reopening of mask strokes is not implemented; the UI states this limitation. Fractional-alpha browser fixtures pass; complex mask-edge fixtures remain pending.
- Google Drive OAuth/network flows were not exercised with an authorized account.
- Camera Raw still performs full-resolution processing on the main thread; very large files and memory ceilings need profiling.
- Blur and OpenCV/worker edge behavior need more reference-pixel tests, including kernel reference pixels and transformed/reordered composite snapshots. Fractional transparency is now covered.
- Some controls may create more than one history entry per continuous gesture; the serialized-byte history cap is not a hard browser-memory cap.
- Import concurrency, IndexedDB quota failures, every filter preset, crop handles/presets, blend modes, touch/pressure input, EXIF/ICC, Firefox/WebKit, and mobile layouts need additional browser coverage.
- SelectionTools remains unmounted, and eraser, clone/heal, perspective, PSD, and several advanced features are explicitly not implemented. See [PHOTO_EDITOR_ROADMAP.md](../roadmaps/PHOTO_EDITOR_ROADMAP.md).

## Deployment compatibility

Verified the built application by direct navigation to `/ultimate-tool-web/visual-tools/photo-editor` on a local server. Static assets and lazy-loaded editor resources loaded sufficiently to complete the browser workflows. No GitHub Pages deployment was triggered.

See [PHOTO_EDITOR_AUDIT.md](../audits/PHOTO_EDITOR_AUDIT.md), [PHOTO_EDITOR_TEST_MATRIX.md](../testing/PHOTO_EDITOR_TEST_MATRIX.md), and [PHOTO_EDITOR_ARCHITECTURE.md](../architecture/PHOTO_EDITOR_ARCHITECTURE.md) for the detailed findings, control inventory, and design.
