import React, { useRef, useEffect, useState } from 'react';
import { Button, Select, Space } from 'antd';
import { CameraRawSettings, CurvePoint, calculateSpline } from '../../utils/cameraRawHelpers';

interface CurvesPanelProps {
  curves: CameraRawSettings['curves'];
  onChange: (curves: CameraRawSettings['curves']) => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  master: '#ffffff', // black/white curve usually white line on dark bg
  red: '#ff4d4f',
  green: '#52c41a',
  blue: '#1890ff',
};

const CurvesPanel: React.FC<CurvesPanelProps> = ({ curves, onChange }) => {
  const [activeChannel, setActiveChannel] = useState<'master' | 'red' | 'green' | 'blue'>('master');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const points = curves[activeChannel];

  // Draw function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#262626'; // Dark background
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#434343';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      const pos = i * (width / 4);
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
    }
    ctx.stroke();

    // Calculate Curve LUT for visualization
    const lut = calculateSpline(points);

    // Draw Curve
    ctx.strokeStyle = CHANNEL_COLORS[activeChannel];
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < 256; x++) {
      const y = lut[x];
      // Canvas Y is inverted (0 at top, 255 at bottom in image coords but usually curves are 0,0 bottom-left)
      // Let's standard: Input X (0..255 left-right), Output Y (0..255 bottom-top)
      // so canvas y = height - (y / 255 * height)
      const cx = (x / 255) * width;
      const cy = height - (y / 255) * height;
      if (x === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw Points
    points.forEach((p, i) => {
      const cx = (p.x / 255) * width;
      const cy = height - (p.y / 255) * height;

      ctx.fillStyle = i === dragIndex ? '#fff' : '#aaa';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, activeChannel, dragIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 255;
    const y = (1 - (e.clientY - rect.top) / rect.height) * 255;

    // Find integer coordinates
    const cx = Math.round(x);
    const cy = Math.round(y);

    // Check if clicked on existing point
    const threshold = 10; // visual distance units
    const idx = points.findIndex(
      (p) => Math.abs(p.x - cx) < threshold && Math.abs(p.y - cy) < threshold,
    );

    if (idx !== -1) {
      setDragIndex(idx);
    } else {
      // Add new point
      const newPoint = { x: cx, y: cy };
      const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
      onChange({ ...curves, [activeChannel]: newPoints });
      // Find the index of the newly added point to drag it immediately
      const newIdx = newPoints.indexOf(newPoint); // object ref might fail due to copy? no, straightforward here but sort changes order
      // Simpler: just set drag index to the new point's location in sorted array
      // Since we might sort, finding by value is safer perfectly, or just wait for next render?
      // For smoothness, let's just trigger updates.
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Clamp to 0..255
    let x = ((e.clientX - rect.left) / rect.width) * 255;
    let y = (1 - (e.clientY - rect.top) / rect.height) * 255;

    x = Math.max(0, Math.min(255, x));
    y = Math.max(0, Math.min(255, y));

    const newPoints = [...points];

    // Constraints: Point cannot cross neighbors in X
    // Start (0) and End (last) usually have fixed X (0 and 255)?
    // User can move start Y and end Y, but X remains 0/255 for coverage.
    // But standard curves allow moving endpoints too? Usually start is fixed at x=0, end x=255.
    // Let's enforce first point x=0, last point x=255.

    const isFirst = dragIndex === 0;
    const isLast = dragIndex === points.length - 1;

    if (isFirst) x = 0;
    if (isLast) x = 255;

    if (!isFirst && !isLast) {
      // Prevent crossing neighbors X
      const prevX = newPoints[dragIndex - 1].x;
      const nextX = newPoints[dragIndex + 1].x;
      // Add some buffer
      x = Math.max(prevX + 1, Math.min(nextX - 1, x));
    }

    newPoints[dragIndex] = { x: Math.round(x), y: Math.round(y) };
    onChange({ ...curves, [activeChannel]: newPoints });
  };

  const handleMouseUp = () => {
    setDragIndex(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Remove point if clicked
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 255;
    const y = (1 - (e.clientY - rect.top) / rect.height) * 255;

    const threshold = 10;
    const idx = points.findIndex(
      (p) => Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold,
    );

    // Don't remove first or last
    if (idx > 0 && idx < points.length - 1) {
      const newPoints = points.filter((_, i) => i !== idx);
      onChange({ ...curves, [activeChannel]: newPoints });
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={activeChannel}
          onChange={setActiveChannel}
          options={[
            { label: 'RGB (Master)', value: 'master' },
            { label: 'Red', value: 'red' },
            { label: 'Green', value: 'green' },
            { label: 'Blue', value: 'blue' },
          ]}
          style={{ width: 120 }}
        />
        <Button
          onClick={() =>
            onChange({
              ...curves,
              [activeChannel]: [
                { x: 0, y: 0 },
                { x: 255, y: 255 },
              ],
            })
          }
        >
          Reset Channel
        </Button>
      </Space>

      <div
        className="curves-canvas-container"
        style={{ cursor: dragIndex !== null ? 'grabbing' : 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          width={256}
          height={256}
          style={{ width: '100%', maxWidth: 256, background: '#222', borderRadius: 4 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  );
};

export default CurvesPanel;
