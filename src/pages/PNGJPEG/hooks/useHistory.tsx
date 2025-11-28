import { MutableRefObject, useEffect, useState } from 'react';

type HistoryItem = {
  url: string;
  label?: string;
  isSetBase: boolean;
};

export type HistoryController = {
  history: HistoryItem[];
  index: number;
  current: HistoryItem;
  push: (url: string, label?: string) => void;
  undo: () => void;
  redo: () => void;
  applyHistory: (idx: number) => void;
};

export default function useHistory(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  overlayRef: MutableRefObject<HTMLCanvasElement | null>,
) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [index, setIndex] = useState(-1);

  const current = history[index];

  //
  /** History management */
  const push = (url: string, label = '', isSetBase = true) => {
    const next = history.slice(0, index + 1);
    next.push({ url, label, isSetBase });
    setHistory(next);
    setIndex(next.length - 1);
  };
  const undo = () => {
    if (index <= 0) return;
    applyHistory(index - 1);
  };
  const redo = () => {
    if (index >= history.length - 1) return;
    applyHistory(index + 1);
  };

  const applyHistory = (idx: number) => {
    const item = history[idx];
    if (!item) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      canvasRef.current!.width = img.naturalWidth;
      canvasRef.current!.height = img.naturalHeight;
      overlayRef.current!.width = img.naturalWidth;
      overlayRef.current!.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
      setIndex(idx);
    };
    img.src = item.url;
  };

  return { history, index, current, push, undo, redo, applyHistory };
}
