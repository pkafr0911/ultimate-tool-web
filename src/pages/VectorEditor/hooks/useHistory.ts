import { useState, useCallback } from 'react';
import { Canvas } from 'fabric';

export const useHistory = (canvas: Canvas | null) => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isHistoryProcessing, setIsHistoryProcessing] = useState<boolean>(false);

  const saveState = useCallback(() => {
    if (!canvas || isHistoryProcessing) return;

    const json = JSON.stringify(canvas.toJSON());

    // If we are in the middle of the history, discard the future
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);

    // Limit history size if needed (e.g., 50)
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvas, history, historyIndex, isHistoryProcessing]);

  const undo = useCallback(() => {
    if (!canvas || historyIndex <= 0 || isHistoryProcessing) return;

    setIsHistoryProcessing(true);
    const newIndex = historyIndex - 1;
    const json = history[newIndex];

    canvas.loadFromJSON(JSON.parse(json), () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      setIsHistoryProcessing(false);
    });
  }, [canvas, history, historyIndex, isHistoryProcessing]);

  const redo = useCallback(() => {
    if (!canvas || historyIndex >= history.length - 1 || isHistoryProcessing) return;

    setIsHistoryProcessing(true);
    const newIndex = historyIndex + 1;
    const json = history[newIndex];

    canvas.loadFromJSON(JSON.parse(json), () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      setIsHistoryProcessing(false);
    });
  }, [canvas, history, historyIndex, isHistoryProcessing]);

  return {
    saveState,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
