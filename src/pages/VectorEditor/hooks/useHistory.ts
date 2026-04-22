import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';

const MAX_HISTORY = 50;

/**
 * Canvas history (undo/redo) backed by serialized JSON snapshots.
 *
 * All mutable state lives in refs and the canvas is tracked via a ref so
 * the returned callbacks (saveState/undo/redo) stay referentially stable
 * even after the Fabric canvas instance is assigned later.
 */
export const useHistory = (canvas: Canvas | null) => {
  const canvasRef = useRef<Canvas | null>(canvas);
  const stackRef = useRef<string[]>([]);
  const indexRef = useRef<number>(-1);
  const processingRef = useRef<boolean>(false);

  // Keep the ref pointed at the latest canvas instance
  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

  // Surfaced for UI (toolbar buttons)
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < stackRef.current.length - 1);
  }, []);

  const saveState = useCallback(() => {
    const c = canvasRef.current;
    if (!c || processingRef.current) return;

    const json = JSON.stringify(c.toJSON());

    // Skip dupes from chained events
    if (stackRef.current[indexRef.current] === json) return;

    // Drop "future" entries when branching from a middle point
    const trimmed = stackRef.current.slice(0, indexRef.current + 1);
    trimmed.push(json);
    if (trimmed.length > MAX_HISTORY) trimmed.shift();

    stackRef.current = trimmed;
    indexRef.current = trimmed.length - 1;
    syncFlags();
  }, [syncFlags]);

  const loadAt = useCallback(
    (newIndex: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const json = stackRef.current[newIndex];
      if (json === undefined) return;

      processingRef.current = true;
      c.loadFromJSON(JSON.parse(json), () => {
        c.renderAll();
        indexRef.current = newIndex;
        processingRef.current = false;
        syncFlags();
      });
    },
    [syncFlags],
  );

  const undo = useCallback(() => {
    if (processingRef.current) return;
    if (indexRef.current <= 0) return;
    loadAt(indexRef.current - 1);
  }, [loadAt]);

  const redo = useCallback(() => {
    if (processingRef.current) return;
    if (indexRef.current >= stackRef.current.length - 1) return;
    loadAt(indexRef.current + 1);
  }, [loadAt]);

  return { saveState, undo, redo, canUndo, canRedo };
};
