# Photo editor architecture

Audit date: 2026-10-13. This describes the implemented editor, not a Photoshop feature specification.

## Entry points and dependencies

`config/routes.ts` mounts `src/pages/PhotoEditor/index.tsx` at `/visual-tools/photo-editor`. Umi Max, React 18, Ant Design 5 and LESS provide the shell. `PhotoEditorProvider` owns UI state; `EditorLayout` mounts the toolbar, canvas, properties, layers and history. `Toolbar.tsx` re-exports the split toolbar implementation.

Fabric **6.9.1** is the active object renderer and interaction engine. Its own TypeScript declarations are used; the conflicting Fabric 5 declaration dependency was removed. Fabric imports are named exports. Image loading, cloning, JSON loading and disposal use promises. See the [official Fabric 6 migration guide](https://www.fabricjs.com/docs/upgrading/upgrading-to-fabric-60/) and [Fabric 6 breaking changes](https://github.com/fabricjs/fabric.js/issues/8299).

OpenCV.js is actively imported by blur processing. A dedicated worker provides a CPU fallback. Camera Raw's modal currently applies the shared CPU pixel pipeline on the main thread; its worker entry point now imports the same pipeline rather than an inconsistent duplicate. Highcharts renders the histogram. Dnd-kit handles layer ordering. Optional Google Drive project transport uses the existing OAuth integration and external Google endpoints; ordinary editing and local persistence stay in the browser.

## Authoritative document

The live Fabric scene is authoritative for editable layers, groups, paths, text, transforms, filters, opacity, visibility, blend modes and clip paths. React stores references for UI selection, not independent serialized layer copies. The layers panel derives its list from scene events. Context holds tool/brush/clipboard state and busy status.

`utils/document.ts` centralizes document dimensions, serialization, loading, export rendering, editability guards and crop. Document dimensions are stored separately from the physical viewport in a WeakMap keyed by the canvas. A document-sized Fabric clipPath bounds the composition. Image import sets native dimensions and fits the viewport, without reducing the image's pixel resolution. ResizeObserver resizes the viewport only.

Version-1 project JSON retains Fabric's top-level `objects`, `background` and `clipPath` fields, adding `photoEditorVersion`, `documentWidth` and `documentHeight`. Layer properties `uid`, `name`, locks, `selectable`, `evented`, `originalSource` and `maskSource` are explicitly serialized. Fabric handles nested groups, image sources, text and filters. Legacy Fabric JSON can be opened; its missing dimensions cannot be recovered exactly, so the current viewport dimensions are the documented fallback.

## Coordinates and rendering

Document coordinates describe actual pixels. Object-local coordinates remain relative to groups. Fabric scene pointers place text and paths; viewport pointers anchor zoom and pan. Crop previews use an unzoomed document render and map CSS pointer positions into backing-canvas coordinates. Eyedropper sampling accounts for the backing-store/CSS ratio (including DPR). Crop offsets top-level objects once and changes document bounds; it retains out-of-bounds editable content behind clipping.

`renderDocument` temporarily uses an identity viewport, renders at document dimensions and restores the viewport in `finally`. Editor control handles are on Fabric's upper canvas and excluded. Snap-guide drawing is suppressed during document rendering. Optional trim intersects visible content bounds with the document; it does not erase the background. PNG preserves alpha; JPEG explicitly composites on white. The export multiplier is deliberate user-controlled resampling. A 64-megapixel output limit rejects excessive allocations without silently lowering resolution.

## Edits and masks

Basic adjustments are Fabric filters applied from image source pixels. Filters are identified by type instead of sparse array slots, and sliders read the selected layer's current filter values. This prevents serialization from shifting a preset into another adjustment's slot. Slider completion records history.

Brush strokes create new vector layers; they do not paint pixels into the selected image. A locked/hidden image is therefore not modified by adding a stroke. Pencil, Circle, Spray, Pattern, dashed/dotted/dash-dot and Marker are retained. No eraser is implemented.

Mask Apply creates an alpha clipPath and retains the image source and its filters. The mask multiplies source alpha rather than overwriting it. The modal combines color-removal and manual grayscale masks. Current limitations: reopening does not provide a full persistent mask-editing session, and prior strokes cannot be reopened (explicitly marked in the dialog). Manual Keep/Remove now overrides automatic alpha using a neutral midpoint; see the roadmap.

Camera Raw Apply is an explicit raster operation: it bakes the displayed filtered source once, resets the baked Fabric filters, retains layer identity/transforms/mask, and records the prior source. It is undoable, but parameter reopening is not a non-destructive adjustment-layer workflow. Blur Apply recomputes from the original composition and current mask, even without Preview. Overlay adds a copy-composited raster snapshot while retaining underlying layers; Flatten explicitly replaces layers.

## History

`useHistoryOptimized` now stores independently restorable document snapshots. The old delta chain could lose its base during eviction; full bounded snapshots deliberately trade compression for correctness. Synchronous refs prevent stale React closures. A microtask coalesces synchronous add/remove/path events into a completed command. Explicit save calls finalize programmatic commands; Fabric modification and text-edit-exit events finalize gestures. Undo/redo has a synchronous processing guard, suppresses history capture while loading, clears stale selections and invalidates future entries after a branch edit. Viewport operations are not part of snapshots.

History is capped at 50 entries and approximately 64 MiB of serialized snapshot text, retaining at least two entries. This is not a hard browser-heap ceiling: decoded images, thumbnail strings, Fabric caches and the two retained snapshots can exceed it. Optional 64px thumbnails use the document renderer. Some style/numeric controls still produce more than one entry per continuous gesture; this remains a P2 limitation.

## Persistence and lifecycle

Local projects are stored in IndexedDB. Write success is reported after transaction commit, and connections close after transactions. A local event refreshes the landing page/project lists after writes. JSON download is the portable editable format; PNG/JPEG/WebP/SVG are export formats, not substitutes for an editable project. PSD is unsupported.

Project loading validates version, object-list shape and dimensions before replacement. Fabric enlivens assets before clearing the live scene. A loading mutex prevents overlapping replacements; UI interactions and shortcuts are gated while loading/restoring. AbortController cancels initial/additional image loads on teardown. Landing-page image requests are queued and validated by decoding, and generation tokens discard reads completed after close/navigation. Fabric disposal and DOM/window listener cleanup remain local to their owning effects.

## Boundaries

`SelectionTools.tsx` is not mounted by this route. There is no authoritative pixel-selection model, selection-constrained painting, clone/heal, perspective warp, image-resize dialog, layer rename UI, or PSD support. Pressure input, cross-browser GPU differences, EXIF/ICC behavior and large-image limits require additional validation. The three report files deliberately distinguish implementation from verified behavior.
