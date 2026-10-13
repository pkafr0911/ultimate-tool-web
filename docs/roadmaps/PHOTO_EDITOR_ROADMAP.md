# Photo editor follow-up roadmap

## Before a stable release

1. Expand per-control browser coverage from the matrix: all filter presets/ranges, crop handles and ratios, blend modes, mask edges/partial alpha, clipboard, IndexedDB reopen/quota failures, rapid import/cancel, large images and fullscreen. Exercise actual pointer transforms/reordering in addition to engine state assertions.
2. Complete persistent mask editing by serializing mask recipe, automatic parameters and manual strokes; current UI explicitly states that Apply replaces a mask and reopening prior strokes is unsupported.
3. Specify group behavior for noncontiguous stacking positions, copy/paste multi-selections, blur snapshot transforms/reordering and SVG raster-filter representation.
4. Add unsaved-document recovery and restore warnings, gesture coalescing for every style/number control, and tested memory limits beyond serialized history text.
5. Validate Google Drive with an authorized account and injected network failures. Upgrade the inherited Puppeteer runner and repair the repository-wide Umi Jest configuration independently.
6. Benchmark small/medium/large and extreme-aspect inputs, EXIF orientation, ICC/browser color behavior, browser zoom, DPR 1/2, Firefox/WebKit, physical touch and pressure. No pressure-sensitivity claim until input hardware is tested.

## Targeted architecture improvements

- Move full-resolution Camera Raw processing to the shared worker with cancellation/versioned results and fallback; avoid allocating full-resolution preset thumbnails.
- Share a defined Gaussian kernel and premultiplied-alpha behavior across OpenCV and worker paths; add edge-pixel reference tests and guaranteed native-matrix cleanup on failure.
- Add command-level async transactions and stronger imported-project schema/resource limits, including oversized nested groups and external image references.

## Advanced functionality (not currently advertised as supported)

- A document-space selection mask with add/subtract/invert/feather and operations constrained by it; connect the currently unused SelectionTools only after this contract exists.
- True layer-local erasing, cloning/healing, dedicated image/canvas resizing, project dimension creation, perspective transforms and proper transform confirmation/cancel.
- Persistent adjustment-layer recipes, layer/mask thumbnails, rename UI and mask-source editing. Real PSD interoperability requires a separate implementation and fixtures; JSON is the current editable format.
