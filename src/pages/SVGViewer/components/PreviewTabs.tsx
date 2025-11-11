import React, { useEffect, useRef, useState } from 'react';
import { Tabs, Button, Space, Segmented, Tooltip, Typography, message } from 'antd'; // Import Ant Design components
import {
  MinusOutlined,
  PlusOutlined,
  SyncOutlined,
  DownloadOutlined,
  CopyOutlined,
  ColumnHeightOutlined,
} from '@ant-design/icons'; // Import icons
import styles from '../styles.less'; // Import CSS module

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

const PreviewTabs: React.FC<Props> = ({
  preview,
  svgCode,
  handleDownload,
  handleCopy,
  svgContainerRef,
  getDataURI,
  getBase64,
}) => {
  // --- State variables ---
  const [activeTab, setActiveTab] = useState('svg');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'black' | 'grey'>('grey');

  // --- Pan (drag) control ---
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  // --- Zoom control ---
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => setZoom((z) => Math.min(z * 2, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z * 0.5, 0.125));
  const handleResetZoom = () => {
    setZoom(fitScale);
    setOffset({ x: 0, y: 0 });
  };

  // --- Measure Tool ---
  const [measure, setMeasure] = useState<{
    x: number;
    y: number;
    distances: { top: number; bottom: number; left: number; right: number };
  } | null>(null);

  // --- Color under cursor ---
  const [hoverColor, setHoverColor] = useState<{ x: number; y: number; color: string } | null>(
    null,
  );

  // --- Setup Offscreen Canvas for Color Sampling ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const updateCanvas = () => {
    const img = new Image();
    img.src = getDataURI();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
      canvasRef.current = canvas;
    };
  };

  const [fitScale, setFitScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit SVG to container
  useEffect(() => {
    const fitSvgToContainer = () => {
      const container = containerRef.current;
      const svgWrapper = svgContainerRef.current;
      if (!container || !svgWrapper) return;

      const svgEl = svgWrapper.querySelector('svg');
      if (!svgEl) return;

      const bbox = svgEl.getBBox();
      const containerRect = container.getBoundingClientRect();
      if (!bbox.width || !bbox.height) return;

      const scaleX = containerRect.width / bbox.width;
      const scaleY = containerRect.height / bbox.height;
      const scale = Math.min(scaleX, scaleY, 1); // Prevent upscaling beyond 100%

      setFitScale(scale);
      setZoom(scale); // Initialize zoom to fit scale
      setOffset({ x: 0, y: 0 });
    };

    fitSvgToContainer();
    window.addEventListener('resize', fitSvgToContainer);
    return () => window.removeEventListener('resize', fitSvgToContainer);
  }, [preview]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Triggered when mouse button is pressed down on the div
    e.preventDefault(); // Prevents default browser drag behavior (like image dragging)
    setIsDragging(true); // Marks that dragging has started
    setStart({
      // Records the starting mouse position relative to current offset
      x: e.clientX - offset.x, // Calculate X starting point (adjusted by current offset)
      y: e.clientY - offset.y, // Calculate Y starting point (adjusted by current offset)
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Triggered when mouse moves over the div
    if (!isDragging || !start) return; // Do nothing if dragging hasn’t started or start point is missing
    setOffset({
      // Update the offset (i.e., how much the SVG has been moved)
      x: e.clientX - start.x, // Calculate new X offset based on current mouse position
      y: e.clientY - start.y, // Calculate new Y offset based on current mouse position
    });
  };

  const handleMouseUp = () => {
    // Triggered when mouse button is released
    setIsDragging(false); // Ends the dragging state
    setStart(null); // Clears the starting position
  };

  // --- Ctrl + Scroll Zoom Control (Zoom centered around cursor) ---
  useEffect(() => {
    const container = svgContainerRef.current?.parentElement; // The previewSection div
    const svgEl = svgContainerRef.current?.querySelector('svg'); // The actual SVG element
    if (!container || !svgEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // Only zoom when holding Ctrl
      e.preventDefault(); // Prevent page zoom

      const rect = container.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();

      // Mouse position relative to SVG (not container)
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      setZoom((prevZoom) => {
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // Smooth scaling up/down
        const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.1), 10); // Limit zoom range
        const scaleChange = newZoom / prevZoom;

        // Keep the mouse point fixed while zooming (Figma-style math)
        setOffset((prevOffset) => ({
          x: mouseX - (mouseX - prevOffset.x) * scaleChange,
          y: mouseY - (mouseY - prevOffset.y) * scaleChange,
        }));

        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [svgContainerRef]);

  useEffect(() => {
    updateCanvas();
  }, [preview]);

  // --- Measure tool (Alt) ---
  useEffect(() => {
    const svgEl = svgContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.altKey) {
        const rect = svgEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMeasure({
          x,
          y,
          distances: {
            top: y,
            bottom: rect.height - y,
            left: x,
            right: rect.width - x,
          },
        });
      } else {
        setMeasure(null);
      }

      // --- Color pick ---
      const canvas = canvasRef.current;
      if (canvas && !e.altKey) {
        const rect = svgEl.getBoundingClientRect();
        const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
        const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const color = `#${[pixel[0], pixel[1], pixel[2]]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')}`;
          setHoverColor({ x: e.clientX, y: e.clientY, color });
        }
      }
    };

    const handleLeave = () => {
      setMeasure(null);
      setHoverColor(null);
    };

    svgEl.addEventListener('mousemove', handleMouseMove);
    svgEl.addEventListener('mouseleave', handleLeave);
    return () => {
      svgEl.removeEventListener('mousemove', handleMouseMove);
      svgEl.removeEventListener('mouseleave', handleLeave);
    };
  }, [svgContainerRef]);

  // --- Convert SVG to Canvas image (PNG or ICO) ---
  const svgToCanvas = async (mimeType: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image(); // Create image element
      img.onload = () => {
        const canvas = document.createElement('canvas'); // Create canvas
        canvas.width = img.width; // Set width
        canvas.height = img.height; // Set height
        const ctx = canvas.getContext('2d'); // Get 2D context
        if (!ctx) return reject('Canvas context not found'); // Error if context missing
        ctx.drawImage(img, 0, 0); // Draw image on canvas
        resolve(canvas.toDataURL(mimeType)); // Return as data URL
      };
      img.onerror = reject; // Reject on load error
      img.src = getDataURI(); // Set image source
    });
  };

  // --- Download PNG ---
  const handleDownloadPng = async () => {
    try {
      const dataUrl = await svgToCanvas('image/png'); // Convert SVG to PNG
      const link = document.createElement('a'); // Create link
      link.href = dataUrl;
      link.download = 'image.png'; // Set filename
      link.click(); // Trigger download
    } catch {
      message.error('Failed to convert to PNG.');
    }
  };

  // --- Download ICO ---
  const handleDownloadIco = async () => {
    try {
      const dataUrl = await svgToCanvas('image/x-icon'); // Convert SVG to ICO
      const link = document.createElement('a'); // Create link
      link.href = dataUrl;
      link.download = 'favicon.ico'; // Set filename
      link.click(); // Trigger download
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
        onChange={(key) => setActiveTab(key)}
        items={[
          {
            key: 'svg',
            label: 'SVG',
            children: (
              <div
                className={`${styles.previewSection} ${styles[bgMode]}`}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
                    __html: preview
                      .split('<!-- New SVG appended -->')
                      .map((part, i) => `<div>${part}</div>`)
                      .join(''),
                  }}
                />
                {/* Alt Measure Tooltip */}
                {measure && (
                  <div
                    style={{
                      position: 'absolute',
                      top: measure.y,
                      left: measure.x + 12,
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      padding: '2px 4px',
                      fontSize: 12,
                    }}
                  >
                    <ColumnHeightOutlined /> {Math.round(measure.distances.top)}px ↑↓{' '}
                    {Math.round(measure.distances.bottom)}px
                  </div>
                )}

                {/* Hover Color Tooltip */}
                {hoverColor && !measure && (
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
                        display: 'inline-block',
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
                <img src={getDataURI()} alt="PNG preview" style={{ maxWidth: '100%' }} />
              </div>
            ),
          },
          {
            key: 'ico',
            label: 'ICO',
            children: (
              <div className={`${styles.previewSection} ${styles[bgMode]}`}>
                <img src={getDataURI()} alt="ICO preview" style={{ maxWidth: '100%' }} />
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

      {/* Bottom-left: background mode switch */}
      <div className={styles.previewFooter}>
        <Space>
          <Segmented
            size="small"
            options={[
              { label: 'Transparent', value: 'transparent' },
              { label: 'White', value: 'white' },
              { label: 'Grey', value: 'grey' },
              { label: 'Black', value: 'black' },
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
      </div>

      {/* Bottom-right: download / copy actions */}
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
                `Copied ${activeTab.toUpperCase()} to clipboard!`,
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
