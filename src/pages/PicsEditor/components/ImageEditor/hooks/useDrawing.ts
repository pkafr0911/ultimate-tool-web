import { useState, useRef } from 'react';

export const useDrawing = () => {
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawLineWidth, setDrawLineWidth] = useState(2);
  const [brushType, setBrushType] = useState<'hard' | 'soft'>('hard');
  const [brushOpacity, setBrushOpacity] = useState(1); // 0 - 1
  const [brushFlow, setBrushFlow] = useState(1); // 0 - 1
  const [isDrawing, setIsDrawing] = useState(false);
  const drawPoints = useRef<{ x: number; y: number }[]>([]);
  const resizingBrush = useRef(false);
  const resizeStartX = useRef<number | null>(null);
  const initialLineWidth = useRef(drawLineWidth);

  return {
    drawColor,
    setDrawColor,
    drawLineWidth,
    setDrawLineWidth,
    brushType,
    setBrushType,
    brushOpacity,
    setBrushOpacity,
    brushFlow,
    setBrushFlow,
    isDrawing,
    setIsDrawing,
    drawPoints,
    resizingBrush,
    resizeStartX,
    initialLineWidth,
  };
};
