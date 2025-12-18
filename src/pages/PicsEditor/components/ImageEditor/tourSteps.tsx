import React from 'react';
import { TourProps } from 'antd';

export const getTourSteps = (
  sidebarRef: React.RefObject<HTMLDivElement>,
  canvasContainerRef: React.RefObject<HTMLDivElement>,
  toolbarRef: React.RefObject<HTMLDivElement>,
): TourProps['steps'] => [
  {
    title: '🎨 Welcome to Pics Editor',
    description:
      'This is a powerful image editing tool with many features. Let me show you around!',
    target: null,
  },
  {
    title: '🛠️ Side Panel',
    description:
      'Access all editing tools here: adjustments, effects, color grading, and export options. Apply changes to see them on the canvas.',
    target: () => sidebarRef.current!,
  },
  {
    title: '🖼️ Canvas Area',
    description:
      'Your main workspace. Use Space + drag to pan, scroll to zoom, or Alt + scroll for fine zoom control. The resolution is shown in the top right.',
    target: () => canvasContainerRef.current!,
  },
  {
    title: '⌨️ Top Toolbar',
    description:
      'Quick access to undo/redo, zoom controls, and tool-specific options. Draw settings, layer management, and text formatting appear when those tools are active.',
    target: () => toolbarRef.current!,
  },
  {
    title: '🎭 Hand Tool (Hold "Space" or press "H")',
    description:
      'Navigate around your canvas. Hold Space key anywhere to temporarily activate pan mode, making it easy to move around large images.',
  },
  {
    title: '✂️ Crop Tool (C)',
    description:
      'Click and drag to select a crop area. Press Enter to apply the crop or Escape to cancel. Perfect for trimming images to the exact size you need.',
  },
  {
    title: '🎨 Color Picker (I)',
    description:
      'Click on any pixel to pick its color. Hold Shift while clicking to pick from the original unedited image instead of the current edited version.',
  },
  {
    title: '🗑️ Color Removal (K)',
    description:
      'Remove specific colors from your image. First use the Color Picker (I) to select a color, then activate this tool to remove it with adjustable tolerance and feathering for smooth edges.',
  },
  {
    title: '📏 Ruler Tool (R)',
    description:
      'Measure distances on your image. Click two points to measure in pixels, then optionally enter a real-world measurement to calculate and display the image DPI.',
  },
  {
    title: '🔲 Perspective Tool (P)',
    description:
      "Correct perspective distortion in photos. Click to place 4 corner points clockwise, adjust them to match the object's corners, then apply to straighten the perspective.",
  },
  {
    title: '✏️ Brush Tool (B)',
    description:
      'Freehand drawing with customizable options: brush size, color, opacity, flow rate, and choose between hard-edge and soft-edge brushes for different effects.',
  },
  {
    title: '🖼️ Layer Tool (V)',
    description:
      'Add and manage image layers. Drag and drop images onto the canvas, adjust opacity and blend modes, resize, rotate (Hold Shift), and position layers with full control.',
  },
  {
    title: '🔤 Text Tool (T)',
    description:
      'Add text overlays with complete formatting control: font family, size, weight (bold/normal), color, alignment (left/center/right), italic, and text decorations (underline/strikethrough).',
  },
  {
    title: '🔍 Upscale',
    description:
      'Enlarge your image intelligently. Choose from quality presets (low/medium/high) and apply enhancement options like sharpen, edge enhancement, and noise reduction for best results.',
  },
  {
    title: '💾 Export (Ctrl + Shift + S)',
    description:
      'Export your edited image as PNG or JPG with optional overlay layers, or convert to scalable SVG format with customizable tracing parameters for vector graphics.',
  },
  {
    title: '⌨️ Keyboard Shortcuts',
    description: (
      <div style={{ lineHeight: 1.8 }}>
        <div>
          <strong>Space</strong>: Pan tool (hold anywhere)
        </div>
        <div>
          <strong>C</strong>: Crop tool
        </div>
        <div>
          <strong>I</strong>: Color picker
        </div>
        <div>
          <strong>K</strong>: Color removal
        </div>
        <div>
          <strong>R</strong>: Ruler tool
        </div>
        <div>
          <strong>P</strong>: Perspective tool
        </div>
        <div>
          <strong>D</strong>: Draw tool
        </div>
        <div>
          <strong>L</strong>: Layer tool
        </div>
        <div>
          <strong>T</strong>: Text tool
        </div>
        <div>
          <strong>Ctrl+Z</strong>: Undo
        </div>
        <div>
          <strong>Ctrl+Y / Ctrl+Shift+Z</strong>: Redo
        </div>
        <div>
          <strong>Scroll</strong>: Zoom in/out
        </div>
        <div>
          <strong>Alt+Scroll</strong>: Fine zoom control
        </div>
        <div>
          <strong>Shift+Click</strong>: Pick from original image
        </div>
      </div>
    ),
  },
];
