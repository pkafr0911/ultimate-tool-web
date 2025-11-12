import React, { useEffect, useRef, useState } from 'react';
import { Tabs, Button, Space, Segmented, Tooltip, Typography, message } from 'antd';
import {
  MinusOutlined,
  PlusOutlined,
  SyncOutlined,
  DownloadOutlined,
  CopyOutlined,
  ColumnHeightOutlined,
  BgColorsOutlined,
  AimOutlined,
  DragOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import styles from '../styles.less';

const { Text } = Typography;

type Props = {
  preview: string;
  svgCode: string;
  handleDownload: (content: string, name: string, type: string) => void;
  handleCopy: (val: string, msg: string) => void;
  svgContainerRef: React.RefObject<HTMLDivElement>;
  getDataURI: () => string;
  getBase64: () => string;
};

type ToolMode = 'select' | 'hand' | 'color' | 'measure';

const PreviewTabs: React.FC<Props> = ({
  preview,
  svgCode,
  handleDownload,
  handleCopy,
  svgContainerRef,
  getDataURI,
  getBase64,
}) => {
  const [activeTab, setActiveTab] = useState('svg');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey');

  const [tool, setTool] = useState<ToolMode>('select'); // current tool mode
  const [selectedBox, setSelectedBox] = useState<DOMRect | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{
    tag: string;
    width: number;
    height: number;
  } | null>(null);

  // Drag/pan
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  // Zoom
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z * 0.67, 0.125));
  const handleResetZoom = () => {
    setZoom(fitScale);
    setOffset({ x: 0, y: 0 });
  };

  // Measure + color states
  const [measure, setMeasure] = useState<{ x: number; y: number; distances: any } | null>(null);
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-fit SVG to container
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

  // Update color-sampling canvas
  const updateCanvas = () => {
    const img = new Image(); // 🖼️ Create a new HTML Image object to load the SVG as an image
    img.src = getDataURI(); // 🔗 Set the source to the SVG’s Data URI (base64-encoded image)
    img.onload = () => {
      // ✅ Once the image is fully loaded...
      const canvas = document.createElement('canvas'); // 🧾 Create an offscreen <canvas> element
      canvas.width = img.width; // 📏 Match canvas width to the loaded image width
      canvas.height = img.height; // 📏 Match canvas height to the loaded image height
      const ctx = canvas.getContext('2d'); // 🎨 Get 2D drawing context from the canvas
      if (ctx) ctx.drawImage(img, 0, 0); // 🖌️ Draw the SVG image onto the canvas at (0, 0)
      canvasRef.current = canvas; // 💾 Store the canvas reference for later color sampling
    };
  };

  useEffect(() => updateCanvas(), [preview]); // 🪄 Rebuild the canvas each time the SVG preview changes

  // Keyboard shortcuts for tools
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌨️ Listen for keyboard shortcuts to switch tools
      if (['h', 'H'].includes(e.key)) setTool('hand'); // ✋ Press "H" → Hand tool (move/pan mode)
      if (['c', 'C'].includes(e.key)) setTool('color'); // 🎨 Press "C" → Color picker mode
      if (['r', 'R'].includes(e.key)) setTool('measure'); // 📏 Press "R" → Measure distance mode
      if (['v', 'V'].includes(e.key) || e.key === 'Escape') setTool('select'); // 🖱️ Press "V" or "Esc" → Select mode (default)
    };

    window.addEventListener('keydown', onKeyDown); // 🔊 Attach the key listener to the window
    return () => window.removeEventListener('keydown', onKeyDown); // 🧹 Clean up on unmount to avoid memory leaks
  }, []); // 🪄 Run once on mount (no dependencies)

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

  // Handle tool behaviors (measure / color / select)
  useEffect(() => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const handleMove = (e: MouseEvent) => {
      const rect = svgEl.getBoundingClientRect(); // Get SVG's position and size relative to viewport
      const mouseX = e.clientX - rect.left; // Mouse X relative to SVG
      const mouseY = e.clientY - rect.top; // Mouse Y relative to SVG

      if (tool === 'measure') {
        setMeasure({
          x: e.clientX,
          y: e.clientY,
          distances: {
            top: mouseY,
            bottom: rect.height - mouseY,
            left: mouseX,
            right: rect.width - mouseX,
          },
        });
      } else if (tool === 'color') {
        // --- Color picker: sample pixel color from hidden canvas ---
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Convert mouse coords in SVG to canvas pixel coords
        const canvasX = Math.floor((mouseX / rect.width) * canvas.width);
        const canvasY = Math.floor((mouseY / rect.height) * canvas.height);

        if (canvasX < 0 || canvasY < 0 || canvasX >= canvas.width || canvasY >= canvas.height) {
          return setHoverColor(null); // Out of bounds
        }

        try {
          const p = ctx.getImageData(canvasX, canvasY, 1, 1).data;
          const color = `#${[p[0], p[1], p[2]]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')}`;
          setHoverColor({ x: e.clientX, y: e.clientY, color });
        } catch {
          setHoverColor(null); // Handle tainted canvas errors safely
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (tool !== 'select') return;

      // Make sure click came from inside the SVG
      const target = e.target as Element | null;
      if (!target) return;

      // If user clicked on a child element (path, rect, g, etc.) we want that element.
      // If they clicked on an inner <div> or something outside, bail.
      // Walk up to the nearest SVG graphics element (not the <svg> root).
      let el: Element | null = target;
      // If they clicked on text nodes or child nodes, find nearest element parent
      while (el && el.nodeType !== 1) el = el.parentElement;

      if (!svgEl.contains(el)) return;

      // Skip clicks on the root <svg> itself
      if (el === svgEl) {
        setSelectedBox(null);
        setSelectedInfo(null);
        return;
      }

      // Use getBoundingClientRect — this returns screen coordinates and respects transforms
      const rect = (el as Element).getBoundingClientRect();

      // Save rect directly (DOMRect) so overlay can use top/left/width/height
      setSelectedBox(rect);
      setSelectedInfo({
        tag: (el as Element).tagName,
        width: rect.width,
        height: rect.height,
      });
    };

    const handleLeave = () => {
      setMeasure(null);
      if (tool !== 'color') setHoverColor(null);
    };

    svgEl.addEventListener('mousemove', handleMove);
    svgEl.addEventListener('click', handleClick);
    svgEl.addEventListener('mouseleave', handleLeave);
    return () => {
      svgEl.removeEventListener('mousemove', handleMove);
      svgEl.removeEventListener('click', handleClick);
      svgEl.removeEventListener('mouseleave', handleLeave);
    };
  }, [tool]);

  // Convert SVG → Canvas → DataURL (used for PNG/ICO)
  // --- Convert SVG to Canvas Data URL ---
  const svgToCanvas = async (mimeType: string) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image(); // Create an Image element
      img.onload = () => {
        const canvas = document.createElement('canvas'); // Create canvas
        canvas.width = img.width; // Set canvas size to image size
        canvas.height = img.height;
        const ctx = canvas.getContext('2d'); // Get 2D context
        if (!ctx) return reject('Canvas missing'); // Safety check
        ctx.drawImage(img, 0, 0); // Draw SVG image onto canvas
        resolve(canvas.toDataURL(mimeType)); // Return as Data URL
      };
      img.onerror = reject; // Reject promise on load error
      img.src = getDataURI(); // Use your SVG Data URI as source
    });

  // --- Download PNG file ---
  const handleDownloadPng = async () => {
    try {
      const dataUrl = await svgToCanvas('image/png'); // Convert SVG → PNG
      const link = document.createElement('a'); // Create anchor element
      link.href = dataUrl; // Set href to image Data URL
      link.download = 'image.png'; // Set filename
      link.click(); // Trigger download
    } catch {
      message.error('Failed to convert to PNG.'); // Show error
    }
  };

  // --- Download ICO file ---
  const handleDownloadIco = async () => {
    try {
      const dataUrl = await svgToCanvas('image/x-icon'); // Convert SVG → ICO
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'favicon.ico';
      link.click();
    } catch {
      message.error('Failed to convert to ICO.');
    }
  };

  return (
    <div className={styles.previewWrapper}>
      <Tabs
        size="small"
        style={{ marginTop: 17 }}
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
                  dangerouslySetInnerHTML={{
                    __html: preview,
                  }}
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
            children: <img src={getDataURI()} style={{ maxWidth: '100%' }} />,
          },
          {
            key: 'ico',
            label: 'ICO',
            children: <img src={getDataURI()} style={{ maxWidth: '100%' }} />,
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
      </div>

      {/* Right: Download/Copy actions */}
      <div className={styles.previewActions}>
        {['svg', 'png', 'ico'].includes(activeTab) && (
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={
              activeTab === 'svg'
                ? () => handleDownload(svgCode, 'image.svg', 'image/svg+xml')
                : activeTab === 'png'
                  ? handleDownloadPng
                  : handleDownloadIco
            }
          >
            Download {activeTab.toUpperCase()}
          </Button>
        )}
        {['datauri', 'base64'].includes(activeTab) && (
          <Button
            size="small"
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
        )}
      </div>
    </div>
  );
};

export default PreviewTabs;
