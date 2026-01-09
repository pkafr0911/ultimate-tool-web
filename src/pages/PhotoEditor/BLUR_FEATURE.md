# Blur Brush Feature Documentation

## Overview

The Blur Brush tool allows users to selectively blur areas of their canvas by painting a mask with an adjustable brush. It provides interactive preview and supports both non-destructive overlay mode and permanent flatten mode.

## Features

### UI Components

- **Blur Brush Button**: Located in the main toolbar (HighlightOutlined icon)
- **Interactive Modal**: Full-featured blur editing interface

### Blur Brush Modal

The modal provides:

1. **Dual Canvas View**:
   - Background preview canvas showing the original image
   - Transparent overlay canvas for mask painting
2. **Brush Controls**:
   - Brush Size slider (5-200px)
   - Blur Amount slider (1-100)
   - Feather slider (0-50px) for soft edges
3. **Mask Tools**:
   - Undo last stroke
   - Clear entire mask
4. **Apply Modes**:
   - **Overlay (Non-destructive)**: Adds blurred result as a locked layer on top
   - **Flatten (Permanent)**: Replaces entire canvas with blurred result
5. **Action Buttons**:
   - Update Preview: Test blur settings on a preview
   - Apply Blur: Commit changes to canvas
   - Cancel: Discard all changes

## How It Works

### User Workflow

1. Click Blur Brush button in toolbar
2. Paint red overlay on areas to blur using mouse/stylus
3. Adjust brush size, blur amount, and feather as needed
4. Click "Update Preview" to see result
5. Choose apply mode (Overlay or Flatten)
6. Click "Apply Blur" to commit changes
7. Use Ctrl+Z to undo if needed

### Technical Implementation

#### Mask Painting

- Uses a separate Fabric.Canvas instance for mask drawing
- Draws with semi-transparent red (`rgba(255,0,0,0.5)`) for visual feedback
- Converts painted strokes to binary white-on-black mask for processing

#### Blur Processing (OpenCV.js)

When user previews or applies:

1. Extract painted mask and convert red pixels to white (mask pixels)
2. Capture current canvas state as source image
3. Call `applyBlurWithMask(sourceCanvas, maskCanvas, blurAmount, feather)`:
   - Converts canvases to OpenCV Mats
   - Converts mask to grayscale and thresholds to binary
   - Optionally blurs mask for feathering (soft edges)
   - Applies Gaussian blur to source image
   - Composites: copies blurred pixels where mask is white
   - Returns processed result as HTMLCanvasElement
4. For preview: display result in preview canvas
5. For apply: replace/overlay on main Fabric canvas

#### Apply Modes

- **Overlay**: Creates FabricImage from result and adds as non-selectable layer (preserves original layers underneath)
- **Flatten**: Clears canvas and replaces with single blurred image (permanent, faster rendering after)

### Affected Layers

- **Overlay mode**: Adds new layer without modifying existing objects
- **Flatten mode**: All layers merged into single rasterized image

## Dependencies

### OpenCV.js

- Loaded dynamically from CDN: `https://docs.opencv.org/4.8.0/opencv.js`
- Size: ~1-5MB (WASM build)
- Auto-loads on first use via `loadOpenCv()` helper
- Used for: Gaussian blur, mask processing, image compositing

### Browser Requirements

- Modern browser with WASM support
- Canvas API with `getImageData` (non-tainted canvas)
- Sufficient memory for large images (~2-4x canvas size during processing)

## Edge Cases Handled

### CORS/Tainted Canvas

- If source images are cross-origin without CORS headers, canvas becomes tainted
- `getImageData()` will fail with security error
- Solution: Re-import images as data URLs or use CORS-enabled proxy

### Performance

- **Small-medium canvases** (<2K resolution): Fast, instant preview
- **Large canvases** (>4K): May take 1-3 seconds; spinner shown
- **Very large** (>8K): May freeze UI; recommend downscaling first
- Future: Offload to WebWorker for non-blocking processing

### Memory

- Processing requires ~2-4x canvas memory (source + mask + blurred + composited mats)
- Large blur amounts (>50) with large canvases may cause browser memory warnings
- Solution: Preview with downscaled version, apply at full resolution

### History/Undo

- `history.saveState()` called before applying changes
- After apply, `history.saveState()` called again
- Undo restores to pre-blur state
- Preview updates do not create history entries (non-destructive)

## Testing Checklist

### Basic Functionality

- [ ] Open blur brush modal via toolbar button
- [ ] Paint mask with various brush sizes
- [ ] Undo last stroke works correctly
- [ ] Clear mask removes all strokes
- [ ] Blur amount slider affects preview intensity
- [ ] Feather slider creates smooth edges
- [ ] Preview updates show correct blurred areas
- [ ] Cancel discards all changes

### Apply Modes

- [ ] Overlay mode adds non-selectable layer on top
- [ ] Flatten mode replaces entire canvas
- [ ] Both modes preserve aspect ratio and dimensions
- [ ] History undo after overlay restores original
- [ ] History undo after flatten restores original

### Edge Cases

- [ ] Large canvas (>3000px) shows spinner and completes
- [ ] Small brush (5px) works accurately
- [ ] Large brush (200px) covers area correctly
- [ ] Maximum blur (100) produces strong effect
- [ ] Feather 0 creates hard edges, feather 50 creates very soft edges
- [ ] Empty mask (no painting) handled gracefully
- [ ] Full mask (entire canvas painted) blurs everything

### Performance

- [ ] Preview generation <1s for typical image
- [ ] Apply completes without freezing UI
- [ ] Multiple sequential applies work without memory leak
- [ ] OpenCV.js loads only once (cached)

### Browser Compatibility

- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari (if WASM supported)
- [ ] Touch/stylus input works on tablets

## Known Limitations

1. **Feathering Quality**: Current OpenCV.js `copyTo` with mask uses binary mask; true alpha blending for soft feathering may require manual pixel loop (performance trade-off)
2. **Performance**: Large canvases (>4K) process slowly; no WebWorker offloading yet
3. **CORS**: Cross-origin images without CORS headers will fail; requires re-import
4. **Memory**: Very large blur operations may cause browser memory issues
5. **Mobile**: Performance may be degraded on lower-end mobile devices

## Future Enhancements

1. **WebWorker Integration**: Offload heavy processing to background thread
2. **Progressive Preview**: Show low-res preview while processing full resolution
3. **Eraser Mode**: Toggle between adding and removing mask areas
4. **Mask Invert**: Flip mask to blur everything except painted areas
5. **Preset Patterns**: Radial blur, motion blur, directional blur
6. **Server-Side Processing**: Offload to backend for very large images or ML-based blur
7. **Save/Load Masks**: Persist mask for re-use or adjustment
8. **Real-time Preview**: Update preview as user paints (with debouncing)

## API Reference

### OpenCV Helpers (`opencvHelpers.ts`)

```typescript
loadOpenCv(): Promise<void>
// Lazy-loads OpenCV.js from CDN if not already loaded

applyBlurWithMask(
  sourceCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  blurAmount: number,
  maskFeather: number
): Promise<HTMLCanvasElement>
// Applies Gaussian blur to source where mask is white
// Returns processed canvas
```

### Effects Helpers (`effectsHelpers.ts`)

```typescript
applyBlurResultToCanvas(
  canvas: Canvas,
  resultCanvas: HTMLCanvasElement,
  mode: 'overlay' | 'flatten'
): Promise<void>
// Applies blur result to Fabric canvas
// overlay: adds as locked layer
// flatten: replaces entire canvas
```

### Component Props

```typescript
interface BlurBrushModalProps {
  visible: boolean;
  onCancel: () => void;
  canvas: FabricCanvas | null;
  history: any; // useHistory hook
}
```

## Usage Example

```typescript
// In a component with PhotoEditor context
const { canvas, history } = usePhotoEditor();
const [blurVisible, setBlurVisible] = useState(false);

<BlurBrushModal
  visible={blurVisible}
  onCancel={() => setBlurVisible(false)}
  canvas={canvas}
  history={history}
/>
```

## Troubleshooting

### "OpenCV.js not loaded" error

- Check network connection
- Verify CDN is accessible: `https://docs.opencv.org/4.8.0/opencv.js`
- Try refreshing page

### Canvas tainted / CORS error

- Images must be same-origin or have CORS headers
- Re-import image as data URL
- Use server-side proxy for external images

### Slow performance

- Reduce blur amount for faster preview
- Use smaller brush for less processing
- Downscale very large canvases before blurring
- Clear browser cache if OpenCV.js download is slow

### Blur not visible

- Ensure mask is painted (red overlay visible)
- Increase blur amount (try 30-50)
- Check that painted area overlaps image content
- Click "Update Preview" to regenerate
