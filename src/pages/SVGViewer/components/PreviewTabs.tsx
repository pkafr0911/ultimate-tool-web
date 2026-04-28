import React, { useEffect, useRef, useState } from 'react';
import { Tabs, Button, Space, Segmented, Tooltip, Typography, message } from 'antd';
import {
  AimOutlined,
  BgColorsOutlined,
  CopyOutlined,
  DownloadOutlined,
  DragOutlined,
  ExportOutlined,
  FileTextOutlined,
  MinusOutlined,
  PlusOutlined,
  SelectOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import styles from '../styles.less';
import { ensureSvgSize } from '../utils/helpers';
import { handleCopy } from '@/helpers';

const { Text } = Typography;

type Props = {
  preview: string;
  svgCode: string;
  handleDownload: (content: string, name: string, type: string) => void;
  svgContainerRef: React.RefObject<HTMLDivElement>;
  getDataURI: () => string;
  getBase64: () => string;
};

type ToolMode = 'select' | 'hand' | 'color' | 'measure';

const PreviewTabs: React.FC<Props> = ({
  preview,
  svgCode,
  handleDownload,
  svgContainerRef,
  getDataURI,
  getBase64,
}) => {
  //#region State & Refs

  //#region Tabs & Background
  const [activeTab, setActiveTab] = useState('svg');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey');
  //#endregion

  //#region Tool Selection & Selection Info
  const [tool, setTool] = useState<ToolMode>('select'); // current tool mode
  const [selectedBox, setSelectedBox] = useState<DOMRect | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{
    tag: string;
    width: number;
    height: number;
  } | null>(null);
  const [previousTool, setPreviousTool] = useState<ToolMode | null>(null);
  const [pngScale, setPngScale] = useState<1 | 2 | 4>(2); // PNG export scale multiplier
  //#endregion

  //#region Drag / Pan
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  //#endregion

  //#region Zoom
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z * 0.67, 0.125));
  const handleResetZoom = () => {
    setZoom(fitScale);
    setOffset({ x: 0, y: 0 });
  };
  //#endregion

  //#region Measure & Color
  const [measure, setMeasure] = useState<{ x: number; y: number; distances: any } | null>(null);
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  //#endregion

  //#endregion

  //#region Effects

  //#region Auto-fit SVG to Container
  useEffect(() => {
    const fitSvgToContainer = () => {
      const container = containerRef.current; // 📦 The visible preview area container
      const svgWrapper = svgContainerRef.current; // 🧩 Wrapper div containing the SVG
      if (!container || !svgWrapper) return; // 🚫 Stop if either element is missing

      const svgEl = svgWrapper.querySelector('svg'); // 🔍 Find the actual <svg> element
      if (!svgEl) return; // 🚫 No SVG found — nothing to fit

      const bbox = svgEl.getBBox(); // 📐 Get the SVG's natural bounding box (its width & height)
      const containerRect = container.getBoundingClientRect(); // 📏 Get the container’s pixel size on screen
      if (!bbox.width || !bbox.height) return; // ⚠️ Avoid division by zero for empty SVG

      const scale = Math.min(
        containerRect.width / bbox.width, // ➗ How much we can scale horizontally to fit
        containerRect.height / bbox.height, // ➗ How much we can scale vertically to fit
        1, // 🚫 Don’t upscale beyond 100% (keep at most its original size)
      );

      setFitScale(scale); // 💾 Store this as the "fit to screen" scale baseline
      setZoom(scale); // 🔍 Initialize zoom to match that scale
      setOffset({ x: 0, y: 0 }); // 🎯 Center/Reset pan offset (start from origin)
    };

    fitSvgToContainer(); // ⚡ Run immediately when component mounts or preview changes

    window.addEventListener('resize', fitSvgToContainer); // 🔄 Auto-refit SVG when window size changes
    return () => window.removeEventListener('resize', fitSvgToContainer); // 🧹 Cleanup on unmount
  }, [preview]); // 🪄 Re-run whenever the SVG preview changes
  //#endregion

  //#region Update Canvas for Color Sampling
  const updateCanvas = () => {
    const img = new Image(); // 🖼️ Create a new HTML Image object to load the SVG as an image
    img.src = getDataURI(); // 🔗 Set the source to the SVG’s Data URI (base64-encoded image)
    img.onload = () => {
      // ✅ Once the image is fully loaded...
      const canvas = document.createElement('canvas'); // 🧾 Create an offscreen <canvas> element
      canvas.width = img.width; // 📏 Match canvas width to the loaded image width
      canvas.height = img.height; // 📏 Match canvas height to the loaded image height
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); // 🎨 Get 2D drawing context from the canvas
      if (ctx) ctx.drawImage(img, 0, 0); // 🖌️ Draw the SVG image onto the canvas at (0, 0)
      canvasRef.current = canvas; // 💾 Store the canvas reference for later color sampling
    };
  };

  useEffect(() => updateCanvas(), [preview]); // 🪄 Rebuild the canvas each time the SVG preview changes
  //#endregion

  //#region Keyboard Shortcuts for Tools
  useEffect(() => {
    // Skip shortcuts when user is typing in an input, textarea, contentEditable, or Monaco editor.
    const isTypingContext = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
      if (el.isContentEditable) return true;
      // Monaco/CodeMirror: their editable surfaces have role="textbox" or class monaco-editor.
      if (el.closest?.('.monaco-editor, [role="textbox"]')) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingContext(e.target)) return;
      // Ignore when modifier keys are held (let browser shortcuts work).
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Temporarily switch to hand when holding space
      if (e.code === 'Space') {
        e.preventDefault(); // ❌ Prevent default scroll immediately
        if (tool !== 'hand') {
          setPreviousTool(tool); // Save current tool
          setTool('hand'); // Switch to hand
        }
        return;
      }

      // ⌨️ Single-letter tool shortcuts
      const k = e.key.toLowerCase();
      if (k === 'h') setTool('hand');
      else if (k === 'c') setTool('color');
      else if (k === 'r') setTool('measure');
      else if (k === 'v' || e.key === 'Escape') setTool('select');
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isTypingContext(e.target)) return;
      // Restore previous tool when space released
      if (e.code === 'Space' && previousTool) {
        setTool(previousTool);
        setPreviousTool(null);
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false }); // 🔊 Attach the key listener to the window
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown); // 🧹 Clean up on unmount to avoid memory leaks
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tool, previousTool]);

  // Mouse events for drag in hand mode
  // When mouse is pressed down
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== 'hand') return; // Only activate if the current tool is the "hand" tool
    e.preventDefault(); // Prevent default browser drag behavior
    setIsDragging(true); // Start drag mode
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    // Save the initial mouse position adjusted by current offset
  };

  // When mouse moves
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'hand' && isDragging && start) {
      setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
      // Update offset dynamically to move (pan) the content with the mouse
    }
  };

  // When mouse is released
  const handleMouseUp = () => {
    setIsDragging(false); // Stop dragging
    setStart(null); // Clear the start position
  };

  // Ctrl+wheel zoom (same)
  useEffect(() => {
    // Get the main container and the <svg> element inside it
    const container = svgContainerRef.current?.parentElement;
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!container || !svgEl) return; // Safety check

    // --- Handle zooming with Ctrl + Scroll ---
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // Only trigger zoom when Ctrl is held
      e.preventDefault(); // Prevent default browser zoom (e.g., page zoom)

      // Get bounding boxes for container and SVG
      const rect = container.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();

      // Calculate mouse position relative to the SVG
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      // Update zoom state
      setZoom((prev) => {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // Determine zoom direction — scroll up = zoom in, scroll down = zoom out
        const newZoom = Math.min(Math.max(prev * zoomFactor, 0.1), 10); // Clamp zoom level between 0.1× and 10×

        const scaleChange = newZoom / prev; // Calculate how much scaling changed

        // Adjust pan offset so the zoom stays centered around the mouse
        setOffset((prevOffset) => ({
          x: mouseX - (mouseX - prevOffset.x) * scaleChange,
          y: mouseY - (mouseY - prevOffset.y) * scaleChange,
        }));

        return newZoom;
      });
    };

    // Add listener with passive: false so preventDefault works
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup on unmount or dependency change
    return () => container.removeEventListener('wheel', handleWheel);
  }, [svgContainerRef]);
  //#endregion

  //#region Tool Behaviors (Measure / Color / Select)
  useEffect(() => {
    const svgEl = svgContainerRef.current?.querySelector('svg'); // 🔍 Get the <svg> element
    if (!svgEl) return;

    // 🎨 Sample color from hidden canvas at mouse position
    const sampleColor = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null; // ❌ No canvas, can't sample
      const rect = svgEl.getBoundingClientRect(); // 📏 SVG position
      const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width); // 🖱️ Map mouse X to canvas
      const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height); // 🖱️ Map mouse Y to canvas
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null; // ⚠️ Out of bounds

      try {
        const p = canvas
          .getContext('2d', { willReadFrequently: true })!
          .getImageData(x, y, 1, 1).data; // 🎨 Get pixel RGBA
        return `#${[p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`; // 🔗 Convert to hex
      } catch {
        return null; // ❌ Failed (tainted canvas)
      }
    };

    // 🔄 Handle mouse move
    const handleMove = (e: MouseEvent) => {
      if (tool === 'measure') {
        // 📏 Measure distances
        const rect = svgEl.getBoundingClientRect();
        setMeasure({
          x: e.clientX,
          y: e.clientY,
          distances: {
            top: e.clientY - rect.top,
            bottom: rect.height - (e.clientY - rect.top),
            left: e.clientX - rect.left,
            right: rect.width - (e.clientX - rect.left),
          },
        });
      } else if (tool === 'color') {
        // 🎨 Hover color preview
        const color = sampleColor(e);
        setHoverColor(color ? { x: e.clientX, y: e.clientY, color } : null);
      }
    };

    // 🖱️ Handle click events
    const handleClick = (e: MouseEvent) => {
      if (tool === 'select') {
        // 🔹 Select element
        let el = e.target as Element | null;
        while (el && el.nodeType !== 1) el = el.parentElement; // ⬆️ Walk up to nearest element
        if (!el || el === svgEl) return (setSelectedBox(null), setSelectedInfo(null)); // ❌ Skip SVG root

        const rect = el.getBoundingClientRect(); // 📏 Element bounding box
        setSelectedBox(rect); // 🔲 Show overlay
        setSelectedInfo({ tag: el.tagName, width: rect.width, height: rect.height }); // ℹ️ Save info
      } else if (tool === 'color') {
        // 🎨 Copy color on click
        const color = sampleColor(e);
        if (color) {
          setHoverColor({ x: e.clientX, y: e.clientY, color }); // 👀 Update tooltip
          handleCopy(color); // 📋 Copy to clipboard
        }
      }
    };

    // ❌ Reset hover/measure on mouse leave
    const handleLeave = () => {
      setMeasure(null);
      if (tool !== 'color') setHoverColor(null);
    };

    // 🖇️ Attach event listeners
    svgEl.addEventListener('mousemove', handleMove);
    svgEl.addEventListener('click', handleClick);
    svgEl.addEventListener('mouseleave', handleLeave);

    // 🧹 Cleanup
    return () => {
      svgEl.removeEventListener('mousemove', handleMove);
      svgEl.removeEventListener('click', handleClick);
      svgEl.removeEventListener('mouseleave', handleLeave);
    };
  }, [tool]);
  //#endregion

  //#endregion

  //#region Export / Download Handlers

  // Convert SVG → Canvas → DataURL (used for PNG/ICO) with optional scale factor.
  const svgToCanvas = async (mimeType: string, scale = 1) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject('Canvas missing');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(mimeType));
      };
      img.onerror = reject;
      img.src = getDataURI();
    });

  // --- Download PNG file at the selected scale ---
  const handleDownloadPng = async () => {
    try {
      const dataUrl = await svgToCanvas('image/png', pngScale);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `image@${pngScale}x.png`;
      link.click();
    } catch {
      message.error('Failed to convert to PNG.');
    }
  };

  // --- Download ICO file (browser returns PNG-encoded data for .ico filename) ---
  const handleDownloadIco = async () => {
    try {
      // Browsers don't truly encode ICO — we save a 128x128 PNG with .ico extension.
      const dataUrl = await svgToCanvas('image/png', 1);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'favicon.ico';
      link.click();
      message.info('Saved as .ico (PNG-encoded). Use a dedicated converter for a multi-size ICO.');
    } catch {
      message.error('Failed to convert to ICO.');
    }
  };

  // --- Download a raw text file (Data URI / Base64) ---
  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // --- Open raw SVG in a new tab ---
  const handleOpenRaw = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    // Best-effort revoke after 30s (let browser fully load)
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  //#endregion

  return (
    <div className={styles.previewWrapper}>
      <Tabs
        size="small"
        className={styles.previewTabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'svg',
            label: 'SVG',
            children: (
              <div
                className={`${styles.previewSection} ${styles[bgMode]}`}
                ref={containerRef}
                style={{
                  cursor:
                    tool === 'hand'
                      ? isDragging
                        ? 'grabbing'
                        : 'grab'
                      : tool === 'select'
                        ? 'pointer'
                        : 'crosshair',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  ref={svgContainerRef}
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    display: 'inline-block',
                  }}
                  dangerouslySetInnerHTML={{ __html: ensureSvgSize(preview, 512, 512) }}
                />

                {/* Selected element overlay */}
                {selectedBox && tool === 'select' && (
                  <div
                    style={{
                      position: 'fixed',
                      top: selectedBox.y,
                      left: selectedBox.x,
                      width: selectedBox.width,
                      height: selectedBox.height,
                      border: '2px solid #1890ff',
                      pointerEvents: 'none',
                      boxShadow: '0 0 4px rgba(24,144,255,0.5)',
                    }}
                  />
                )}

                {/* Selected element tooltip */}
                {selectedInfo && tool === 'select' && (
                  <div
                    style={{
                      position: 'fixed',
                      top: (selectedBox?.y ?? 0) - 30,
                      left: selectedBox?.x ?? 0,
                      background: '#1890ff',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    &lt;{selectedInfo.tag}&gt; • {Math.round(selectedInfo.width)}×
                    {Math.round(selectedInfo.height)}px
                  </div>
                )}

                {/* Measure tooltip */}
                {measure && tool === 'measure' && (
                  <div
                    style={{
                      position: 'fixed',
                      top: measure.y + 15,
                      left: measure.x + 15,
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      padding: '2px 4px',
                      fontSize: 12,
                      pointerEvents: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  >
                    📏 {Math.round(measure.distances.top)}px ↑↓{' '}
                    {Math.round(measure.distances.bottom)}px
                  </div>
                )}

                {/* Color tooltip */}
                {hoverColor && tool === 'color' && (
                  <div
                    style={{
                      position: 'fixed',
                      top: hoverColor.y + 15,
                      left: hoverColor.x + 15,
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      padding: '2px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      zIndex: 999,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        background: hoverColor.color,
                        border: '1px solid #aaa',
                        borderRadius: 2,
                      }}
                    />
                    {hoverColor.color}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'png',
            label: 'PNG',
            children: (
              <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                <img src={getDataURI()} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </div>
            ),
          },
          {
            key: 'ico',
            label: 'ICO',
            children: (
              <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                <img src={getDataURI()} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </div>
            ),
          },
          {
            key: 'datauri',
            label: 'Data URI',
            children: <pre className={styles.previewCodeBox}>{getDataURI()}</pre>,
          },
          {
            key: 'base64',
            label: 'Base64',
            children: <pre className={styles.previewCodeBox}>{getBase64()}</pre>,
          },
        ]}
      />

      {/* Footer: Background + Zoom + Tool buttons */}
      <div className={styles.previewFooter}>
        <Space wrap>
          <Segmented
            style={{ padding: 5 }}
            size="small"
            options={[
              {
                label: (
                  <Tooltip title="Transparent">
                    <div
                      style={{
                        margin: 2,
                        width: 16,
                        height: 16,
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        backgroundImage: `
                          linear-gradient(45deg, #ccc 25%, transparent 25%),
                          linear-gradient(-45deg, #ccc 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #ccc 75%),
                          linear-gradient(-45deg, transparent 75%, #ccc 75%)
                        `,
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundSize: '20px 20px',
                      }}
                    />
                  </Tooltip>
                ),
                value: 'transparent',
              },
              {
                label: (
                  <Tooltip title="White">
                    <div
                      style={{
                        margin: 2,
                        width: 16,
                        height: 16,
                        background: '#ffffff',
                        border: '1px solid #ccc',
                        borderRadius: 2,
                      }}
                    />
                  </Tooltip>
                ),
                value: 'white',
              },
              {
                label: (
                  <Tooltip title="Grey">
                    <div
                      style={{
                        margin: 2,
                        width: 16,
                        height: 16,
                        background: '#808080',
                        border: '1px solid #ccc',
                        borderRadius: 2,
                      }}
                    />
                  </Tooltip>
                ),
                value: 'grey',
              },
              {
                label: (
                  <Tooltip title="Black">
                    <div
                      style={{
                        margin: 2,
                        width: 16,
                        height: 16,
                        background: '#000000',
                        border: '1px solid #ccc',
                        borderRadius: 2,
                      }}
                    />
                  </Tooltip>
                ),
                value: 'black',
              },
            ]}
            value={bgMode}
            onChange={(val) => setBgMode(val as any)}
          />
          <Space>
            <Tooltip title="Select (V)">
              <Button
                size="small"
                type={tool === 'select' ? 'primary' : 'default'}
                icon={<SelectOutlined />}
                onClick={() => setTool('select')}
              />
            </Tooltip>
            <Tooltip title="Hand / Move (H)">
              <Button
                size="small"
                type={tool === 'hand' ? 'primary' : 'default'}
                icon={<DragOutlined />}
                onClick={() => setTool('hand')}
              />
            </Tooltip>
            <Tooltip title="Color Picker (C)">
              <Button
                size="small"
                type={tool === 'color' ? 'primary' : 'default'}
                icon={<BgColorsOutlined />}
                onClick={() => setTool('color')}
              />
            </Tooltip>
            <Tooltip title="Measure (R)">
              <Button
                size="small"
                type={tool === 'measure' ? 'primary' : 'default'}
                icon={<AimOutlined />}
                onClick={() => setTool('measure')}
              />
            </Tooltip>
          </Space>
          <Tooltip title="Zoom Out">
            <Button size="small" icon={<MinusOutlined />} onClick={handleZoomOut} />
          </Tooltip>
          <Tooltip title="Zoom In">
            <Button size="small" icon={<PlusOutlined />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <Button size="small" icon={<SyncOutlined />} onClick={handleResetZoom} />
          </Tooltip>
          <Text type="secondary">{Math.round(zoom * 100)}%</Text>
        </Space>
      </div>

      {/* Right: Download/Copy actions */}
      <div className={styles.previewActions}>
        {activeTab === 'png' && (
          <Segmented
            size="small"
            options={[
              { label: '1×', value: 1 },
              { label: '2×', value: 2 },
              { label: '4×', value: 4 },
            ]}
            value={pngScale}
            onChange={(v) => setPngScale(v as 1 | 2 | 4)}
          />
        )}

        {activeTab === 'svg' && (
          <>
            <Tooltip title="Open raw SVG in a new tab">
              <Button size="small" icon={<ExportOutlined />} onClick={handleOpenRaw}>
                View raw
              </Button>
            </Tooltip>
            <Button
              size="small"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(svgCode, 'image.svg', 'image/svg+xml')}
            >
              Download SVG
            </Button>
          </>
        )}

        {activeTab === 'png' && (
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPng}
          >
            Download PNG @{pngScale}×
          </Button>
        )}

        {activeTab === 'ico' && (
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadIco}
          >
            Download ICO
          </Button>
        )}

        {['datauri', 'base64'].includes(activeTab) && (
          <>
            <Tooltip title="Download as .txt">
              <Button
                size="small"
                icon={<FileTextOutlined />}
                onClick={() =>
                  downloadText(
                    activeTab === 'datauri' ? getDataURI() : getBase64(),
                    activeTab === 'datauri' ? 'image.datauri.txt' : 'image.base64.txt',
                  )
                }
              >
                Download
              </Button>
            </Tooltip>
            <Button
              size="small"
              type="primary"
              icon={<CopyOutlined />}
              onClick={() =>
                handleCopy(
                  activeTab === 'datauri' ? getDataURI() : getBase64(),
                  `Copied ${activeTab.toUpperCase()}!`,
                )
              }
            >
              Copy {activeTab.toUpperCase()}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewTabs;
