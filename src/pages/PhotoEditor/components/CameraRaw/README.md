# Camera Raw (CameraRawModal)

## Overview

Camera Raw is a modal filter that provides selective HSL mixing, curves, color grading, a live preview with RGB histogram, and a canvas color picker that maps sampled hues to HSL channels for quick, targeted adjustments.

## Features

- Live downsampled preview (max 600px) with ~50ms debounce for interactive responsiveness.
- Show before/after toggle and 256-bin RGB histogram computed from the preview.
- HSL Mixer with 8 color bands: red, orange, yellow, green, aqua, blue, purple, magenta.
- Curves (master + R/G/B) implemented via 256-entry LUTs for smooth remapping.
- Color grading (shadows/midtones/highlights), blending, balance, temperature, and tint controls.
- Color picker: click canvas in pick mode or use Alt+Click; touch-supported sampling; samples a small neighborhood and averages RGB for stable results.

## Controls & Shortcuts

- Props (modal): `visible`, `onCancel`, `onApply(processedCanvas)`, `sourceCanvas` — see src/pages/PhotoEditor/components/CameraRaw/CameraRawModal.tsx.
- Pick color: click the Aim/Crosshair icon (pick mode) or hold `Alt` and click to sample without toggling the tool.
- Touch: enable pick mode and tap on the preview (handled by `onTouchStart`).
- Picker feedback: a crosshair and a small tooltip show sampled H (degrees), S (%), and L (%) near the click point.

HSL sliders (in `HslPanel`):

- Hue: -180..180 (degrees)
- Saturation: -1..1 (fractional, e.g. 0.2 → +20%)
- Luminance: -1..1 (fractional)

## Usage

1. Open Camera Raw modal and provide a `sourceCanvas` (the image to process).
2. Use the HSL Mixer, Curves, and Color Grading tabs to tune the preview.
3. Use the Aim button or Alt+Click on the preview to sample a color — the HSL Mixer will open and the corresponding color channel tab will be activated automatically.
4. Click Apply to run the full-resolution pipeline and receive the processed canvas via `onApply`.

## Implementation Notes

- Pipeline: see `src/pages/PhotoEditor/utils/cameraRawHelpers.ts` — the processing order is curves → selective HSL adjustments → color grading → temperature/tint.
- HSL helpers: `rgbToHsl`, `hslToRgb`, `colorRanges`, and `getColorNameFromHue` live in `src/pages/PhotoEditor/utils/hslHelpers.ts` and are used to convert sampled RGB to HSL and map hue to a named channel (wrap-aware ranges).
- Picker sampling: the modal reads a 3×3 neighborhood from the preview canvas, averages RGB, converts to HSL and maps hue → channel; this reduces noise from single-pixel samples.
- Performance: preview is downscaled and updates are debounced; apply runs the full-resolution pipeline in a short timeout to avoid blocking the UI.

## Manual Test Checklist

- Open the Camera Raw modal with a valid `sourceCanvas` and confirm the preview renders.
- Toggle "Show Before" — preview should display the original and histogram should reflect original pixels.
- Enable pick mode and click a colorful area — the overlay shows sampled H/S/L and the HSL Mixer tab opens with the sampled channel active.
- Alt+Click when pick mode is off — should behave the same as pick mode sampling (sets active channel and shows sampled values).
- Touch devices: enable pick mode and tap on canvas — sampling should occur.
- Modify Hue/Sat/L sliders — preview updates (debounced) and histogram changes reflect the adjustments.
- Click Apply — verify `onApply` receives a full-resolution processed `HTMLCanvasElement`.

## Example (quick pick & sample)

1. Open Camera Raw modal with your image loaded as `sourceCanvas`.
2. Click the Aim icon (pick mode) — cursor becomes crosshair.
3. Click a colorful area on the preview; the HSL tab opens and the appropriate color channel (based on sampled hue) is selected. The tooltip shows sampled H/S/L values.

Referenced files:

- src/pages/PhotoEditor/components/CameraRaw/CameraRawModal.tsx
- src/pages/PhotoEditor/components/CameraRaw/HslPanel.tsx
- src/pages/PhotoEditor/utils/hslHelpers.ts

Manual testing checklist and example usage are included above for QA and contributors.
