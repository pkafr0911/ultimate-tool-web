import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useVectorEditor } from '../context';
import styles from '../styles.less';

const StatusBar: React.FC = () => {
  const { canvas, zoom, setZoom, cursor, selectedObject } = useVectorEditor();

  const apply = (nextZoom: number) => {
    if (!canvas) return;
    const z = Math.min(20, Math.max(0.02, nextZoom));
    const cx = (canvas.width || 0) / 2;
    const cy = (canvas.height || 0) / 2;
    canvas.zoomToPoint({ x: cx, y: cy } as any, z);
    setZoom(z);
    canvas.requestRenderAll();
  };

  const resetZoom = () => {
    if (!canvas) return;
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
    canvas.requestRenderAll();
  };

  const fitToScreen = () => {
    if (!canvas) return;
    const objs = canvas.getObjects().filter((o: any) => !o.isTemp);
    if (objs.length === 0) {
      resetZoom();
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    objs.forEach((o) => {
      const br = o.getBoundingRect();
      minX = Math.min(minX, br.left);
      minY = Math.min(minY, br.top);
      maxX = Math.max(maxX, br.left + br.width);
      maxY = Math.max(maxY, br.top + br.height);
    });
    const pad = 40;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const z = Math.min(cw / w, ch / h, 20);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(z);
    const vpt = canvas.viewportTransform!;
    vpt[4] = -minX * z + (cw - (maxX - minX) * z) / 2;
    vpt[5] = -minY * z + (ch - (maxY - minY) * z) / 2;
    canvas.setViewportTransform(vpt);
    setZoom(z);
    canvas.requestRenderAll();
  };

  const selectionLabel = selectedObject ? selectedObject.type || 'object' : '—';

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusLeft}>
        <Tooltip title="Zoom out (Ctrl+−)">
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => apply(zoom / 1.2)} />
        </Tooltip>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <Tooltip title="Zoom in (Ctrl+=)">
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => apply(zoom * 1.2)} />
        </Tooltip>
        <Tooltip title="Fit to screen">
          <Button size="small" icon={<FullscreenOutlined />} onClick={fitToScreen} />
        </Tooltip>
        <Tooltip title="Reset view (Ctrl+0)">
          <Button size="small" onClick={resetZoom}>
            100%
          </Button>
        </Tooltip>
      </div>
      <Space size="large" className={styles.statusRight}>
        <span>
          X: {Math.round(cursor.x)} &nbsp; Y: {Math.round(cursor.y)}
        </span>
        <span>Selection: {selectionLabel}</span>
      </Space>
    </div>
  );
};

export default StatusBar;
