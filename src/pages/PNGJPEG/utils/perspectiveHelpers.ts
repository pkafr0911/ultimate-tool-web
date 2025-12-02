import { message } from 'antd';
import { perspectiveTransform, createCanvas } from './ImageEditorEngine';

export const perspectiveApplyHelper = async (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  overlayRef: React.RefObject<HTMLCanvasElement>,
  perspectivePointsRef: React.MutableRefObject<number[] | null>,
  history: { push: (img: string, label: string) => void },
  setShowPerspectiveModal: (v: boolean) => void,
  drawOverlay: () => void,
) => {
  if (!canvasRef.current || !perspectivePointsRef.current) {
    message.warning('No perspective points defined.');
    return;
  }

  const p = perspectivePointsRef.current;
  const srcPoints: [number, number][] = [];
  for (let i = 0; i < 8; i += 2) {
    const x = p[i];
    const y = p[i + 1];
    if (!isNaN(x) && !isNaN(y)) srcPoints.push([x, y]);
  }

  if (srcPoints.length !== 4) {
    message.error('Please select 4 corner points before applying perspective correction.');
    return;
  }

  const orderPointsClockwise = (pts: [number, number][]) => {
    const cx = pts.reduce((s, r) => s + r[0], 0) / pts.length;
    const cy = pts.reduce((s, r) => s + r[1], 0) / pts.length;

    const sorted = pts
      .map((pt) => ({ pt, angle: Math.atan2(pt[1] - cy, pt[0] - cx) }))
      .sort((a, b) => a.angle - b.angle)
      .map((o) => o.pt as [number, number]);

    let area = 0;
    for (let i = 0; i < sorted.length; i++) {
      const [x1, y1] = sorted[i];
      const [x2, y2] = sorted[(i + 1) % sorted.length];
      area += x1 * y2 - x2 * y1;
    }
    if (area > 0) sorted.reverse();

    let tlIndex = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (
        sorted[i][1] < sorted[tlIndex][1] ||
        (sorted[i][1] === sorted[tlIndex][1] && sorted[i][0] < sorted[tlIndex][0])
      ) {
        tlIndex = i;
      }
    }
    return Array.from(
      { length: sorted.length },
      (_, i) => sorted[(tlIndex + i) % sorted.length],
    ) as any;
  };

  try {
    const ordered = orderPointsClockwise(srcPoints);
    const srcFlat: [number, number, number, number, number, number, number, number] = [
      Math.round(ordered[0][0]),
      Math.round(ordered[0][1]),
      Math.round(ordered[1][0]),
      Math.round(ordered[1][1]),
      Math.round(ordered[2][0]),
      Math.round(ordered[2][1]),
      Math.round(ordered[3][0]),
      Math.round(ordered[3][1]),
    ];

    const destCanvas = perspectiveTransform(
      canvasRef.current!,
      srcFlat,
      canvasRef.current!.width,
      canvasRef.current!.height,
    );

    canvasRef.current.width = destCanvas.width;
    canvasRef.current.height = destCanvas.height;
    overlayRef.current!.width = destCanvas.width;
    overlayRef.current!.height = destCanvas.height;

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
    ctx.drawImage(destCanvas, 0, 0);

    history.push(canvasRef.current.toDataURL(), 'Perspective corrected');

    perspectivePointsRef.current = null;
    setShowPerspectiveModal(false);
    drawOverlay();
    message.success('Perspective correction applied.');
  } catch (err) {
    console.error('Perspective transform failed', err);
    message.error('Failed to apply perspective correction.');
  }
};
