# Photo editor technical audit

Date: 2026-10-13. Scope: the existing PhotoEditor route in this checkout. No deployment or remote writes performed. The editor was repaired in place; surrounding routes and design remain intact.

**Release assessment: substantial core stabilization, not certification of every advertised control.** Automated evidence is recorded in `../testing/PHOTO_EDITOR_TEST_MATRIX.md`; unverified cases and remaining defects are explicitly retained below. Source inspection alone is not a WORKING result.

## Baseline

- Clean working tree at start.
- Active stack: Umi Max/React 18/Ant Design 5/LESS, Fabric 6.9.1, OpenCV blur, CPU worker fallback, Highcharts histogram, dnd-kit layers, IndexedDB, optional Google Drive OAuth.
- Production build passed. TypeScript had three pre-existing errors outside PhotoEditor: a moved `Tool` type import and two invalid Ant dropdown placements. Small corrections now make the repository type check pass.
- Default Jest command failed while parsing Umi configuration, before running tests; its setup-file path also points to a missing file. Added an isolated editor Jest configuration instead of changing application build configuration. The existing Welcome test uses `node:test`, not Jest.
- Installed jsdom's optional native `canvas` binary is absent. Geometry/state tests deliberately disable that optional integration; raster behavior is tested in actual Chrome, not canvas mocks.
- Browser baseline: a 320×180 image opened in a 1010×1100 viewport with no initialized history. Export and project dimensions were viewport-dependent.

## Reproducible issues and resolutions

Each row supplies reproduction, expected vs actual behavior, root cause, fix and regression evidence. P0 denotes data integrity, P1 major editing, P2 quality.

| ID / severity | Feature and reproduction | Expected / original actual | Root cause | Implemented resolution | Regression / status |
|---|---|---|---|---|---|
| A01 P0 | Open image, edit, undo to original | Original restorable / initial image history missing | Mount callback closes over history with null canvas | Latest history ref plus initialized subscription | Browser initial document + history tests; fixed |
| A02 P0 | More than 50 edits, undo to oldest retained entry | Valid scene / delta base can be missing | Eviction removes keyframe without rebasing | Independent bounded snapshots | Jest 60-edit rollover; fixed |
| A03 P0 | Group, crop or replace image; undo immediately | One complete action / intermediate removals and stale entries | Synchronous event saves with stale React closures | Ref state, microtask transaction capture, restore guard | Jest same-tick saves; browser crop/group and history; fixed |
| A04 P0 | Crop then undo/reload | Original dimensions restored / dimensions lost | Fabric JSON does not contain editor dimensions | Versioned document metadata shared by history/save/export | Jest serialization; browser crop/import; fixed |
| A05 P0 | Zoom/pan then export | Native unzoomed output / view transform baked into export | Direct `canvas.toDataURL` used | Shared document renderer with finally-restored viewport | Browser decoded PNG dimensions/pixels at zoom 2; fixed |
| A06 P1 | Crop group or crop after zoom at DPR 2 | One scene-space offset / double group-child offset, wrong preview | Group-local coords offset twice; lower canvas copied directly | Translate top-level objects, document preview, CSS mapping | Jest crop group; browser crop at DPR 2; fixed |
| A07 P0 | Import JSON or crop an empty scene | Complete awaited load / completion callback runs as per-object reviver or never | Fabric 5 callback convention in Fabric 6 | Await shared loader; crop no longer reloads JSON | Browser actual JSON file input; fixed |
| A08 P1 | Lock/hide layers; save/reload; use Hand | Lock and identity persist / locks and IDs lost, events reset | Custom properties omitted; hand resets all evented flags | Explicit properties; Hand no longer mutates per-layer flags | Browser locked project/keyboard tests; fixed |
| A09 P1 | Ungroup a rotated/scaled group | Same world coordinates / shifted or double-transformed children | Manual matrix decomposition without Fabric group exit | Fabric 6 `removeAll`, original insertion position | Browser coordinate comparison <0.001px; fixed |
| A10 P1 | Set a high-index filter, save, reopen and adjust | Same named filters / serialized sparse slots compact | Filters addressed by index | Type-based lookup/update; controlled values and preset refresh | Browser filter round-trip; fixed for tested filter |
| A11 P1 | Type in text/input, arrow/delete/copy/paste | Edit text / global handlers can move or clone canvas objects | Unguarded second keyboard listener, private clipboard | Shared clipboard; editable-target/modal/text guards; blur cleanup | Browser text Backspace and locked guards; fixed |
| A12 P1 | Add text at 200% zoom and pan | Scene position / viewport position stored | `getViewportPoint` used for content | `getScenePoint`, text editing exit reset | Browser position and edit test; fixed |
| A13 P1 | Apply mask to transparent image | Alpha multiplied and source retained / alpha overwritten, source replaced | Destructive replacement and absolute alpha assignment | Serializable image clipPath, mask-only alpha payload | Browser source + undo/redo; partial alpha unit/pixel coverage still limited |
| A14 P1 | Paint blur, click Apply without Preview; repeat Preview | Latest settings applied once / no blur or cumulative blur | Preview canvas used as permanent source and result | Recompute original composition on Preview and Apply | Browser Apply workflow; output-kernel equivalence not exhaustively verified |
| A15 P1 | OpenCV feathered blur | Smooth blend / binary nonzero-mask copy | `copyTo` treats mask as a boolean | Continuous RGB blend preserving source alpha | Source review; needs kernel/edge pixel suite |
| A16 P2 | Align rotated objects | Rendered bounds aligned / origins mistaken for bounding-box corners | Absolute left/top assigned from bounds | Apply bounding-box delta to object origin | Source + crop/geometry tests; alignment UI unverified |
| A17 P2 | Save/delete browser project then view list | Committed save and updated list / early success and stale list | Request success vs transaction completion; independent hook instances | Commit-based success, close DB, refresh event, initial project identity | Source reviewed; IndexedDB round-trip coverage pending |
| A18 P1 | Rapid imports or close during decoding | Ordered layers/no resurrection / pending file overwritten or old read reopens editor | Single file slot and unguarded async reads | Decode validation, queue, generation token, abort cleanup | Source reviewed; concurrency browser case pending |
| A19 P2 | Alt sample on high-DPI canvas | Correct backing pixel / CSS/container coords used as pixels | Missing CSS/backing ratio | Backing-store coordinate sampling; scaled brush overlay | Coordinate unit test; eyedropper UI pixel case pending |
| A20 P2 | Duplicate/empty curve X points | Finite LUT / divide-by-zero or crash | Unvalidated control points | Normalize, deduplicate, identity empty LUT | Jest finite and neutral pipeline tests; fixed |
| A21 P2 | Camera Raw worker vs modal | Same math / different grading scales and algorithms | Duplicated CPU pipelines diverged | Worker imports shared implementation | Neutral pipeline unit; worker parity exhaustive coverage pending |
| A22 P2 | Worker fails or is terminated with work pending | Tasks settle / unresolved promises and unusable worker retained | Pending map cleared without rejection | Reject termination, reset failed worker | Source reviewed; worker failure injection pending |
| A23 P2 | Resize/fullscreen or crop preset | Viewport layout changes, fixed document / content geometry coupled to viewport | Dimensions conflated, only window resize observed | Independent dimensions and ResizeObserver; document crop limits | Browser native document/export; fullscreen/touch pending |
| A24 P2 | Press advertised E or R | Tool exists / E and R were not handled | Marketing and tool registration disagree | Explicit eraser unsupported text; implement existing Rectangle shortcut | Source reviewed; R browser test pending |
| A25 P2 | Export while snap guides visible | No editor guides / after-render guides may contaminate output | Export uses same after-render event | Renderer guard suppresses guides | Source reviewed; active-drag export case pending |

## Source map and inventory boundaries

All files under `src/pages/PhotoEditor` were inventoried. Active surfaces are `index`, `context`, `EditorLayout`, `CanvasArea`, split `Toolbar/*`, `PropertiesPanel`, `AdjustmentPanel`, `BrushPanel`, `TextStylePanel`, `LayerStylePanel`, `AlignControls`, `LayersPanel`, `HistoryPanel`, `CropModal`, `LayerMaskModal`, `CameraRaw/*`, `BlurBrush/BlurBrushModal`, `ExportModal`, `ProjectModal`, `SavedProjectsList`, `UploadArea`, and `PhotoEditorErrorBoundary`. Supporting hooks handle history, keys, import, projects, snapping, preview and notification. Utilities handle storage, document geometry, masks, brush strokes, HSL, curves/Raw, and OpenCV. The worker service owns worker requests. LESS preserves the existing shell and panel layout.

`SelectionTools` is unmounted and not a functioning route feature. `LoadingOverlay` and portions of the notification/progressive-preview APIs are reusable helpers rather than evidence of active feature wiring. Existing feature README/BLUR documentation is descriptive, not test evidence. See the matrix for the visible control inventory and individual verification limits.

## Remaining known issues and release gates

- P1: existing mask reopening does not reconstruct a persistent mask editing session. The UI now explicitly marks reopening prior strokes unsupported. Keep was additionally repaired using a neutral manual mask and is covered by a regression test.
- P2: blur overlay is a full raster composition. It now uses copy compositing to avoid doubling source alpha and is labeled a composite snapshot. Transforms/reordering and fractional-alpha pixel regressions still need broader testing.
- P1: Google Drive actions now await Fabric loads, but authenticated list/save/load and network failures were not exercised. External-asset projects still rely on browser/CORS availability.
- P2: some style/numeric sliders still save per change rather than per gesture; history bounds are not a hard heap cap.
- P2: Camera Raw full-resolution Apply still runs on the main thread; repeated dialogs/large-file memory and physical pressure/touch are not certified. OpenCV and CPU fallback kernels are not identical.
- P2: brush subtype/shadow settings now persist in context; all subtype-specific stroke pixels still need dedicated tests.
- P2: no general unsaved-changes navigation recovery; saving explicitly remains necessary.
- P2: SVG, JPEG/WebP quality differences, EXIF orientation, color profiles, accessibility, mobile input and browser page zoom need broader tests.
- Default `npm test` remains blocked by pre-existing Umi Jest setup. `npm run test:photo-editor` is the verified independent regression command.

These remaining issues mean the complete mission's definition of done is **not yet met**. No unsupported feature is represented as verified. Further work is scoped in `../roadmaps/PHOTO_EDITOR_ROADMAP.md`.

## Follow-up failure-path audit — 2026-10-14

| Severity | Reproduction / expected vs actual | Root cause and correction | Evidence |
|---|---|---|---|
| P1 | Import JSON containing an undecodable image; later additions should still render automatically, but automatic rendering remained disabled | Fabric 6 restores `renderOnAddRemove` only after successful enlivening; shared loader now restores the prior value in `finally` | Jest rejection regression and real-browser corrupt-image import; existing scene/history retained |
| P1 | Import project with top-level viewport/canvas settings; document data should not alter editor configuration | Fabric passes remaining JSON fields to canvas setters; loader now allows only scene fields | Jest checks the exact forwarded scene fields |
| P2 | Throw during OpenCV blur or output rendering; native allocations should be released, but cleanup was success-only | Track each allocated Mat and release in `finally` | Three Jest cases: success, blur throw, render throw |
| P2 | Worker posting or message decoding fails; pending requests should settle | Synchronous post failure retained a pending task; message errors lacked a handler | Pending task removal and shared worker failure handler; source reviewed |

Editor teardown now aborts the active shared document load. Browser coverage additionally confirms fractional source alpha is applied once through masks and blur snapshots, JPEG transparent pixels become white, PNG/WebP retain transparency, and Ctrl-S commits editable project data to IndexedDB.
