import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from 'fabric';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  snapshot: string; // Full JSON for key frames
  delta?: string; // Delta from previous state (for optimization)
  description?: string;
  thumbnail?: string;
}

export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  isProcessing: boolean;
}

interface UseHistoryOptimizedOptions {
  maxEntries?: number;
  keyFrameInterval?: number; // Save full snapshot every N changes
  enableThumbnails?: boolean;
  thumbnailSize?: number;
}

const DEFAULT_OPTIONS: UseHistoryOptimizedOptions = {
  maxEntries: 50,
  keyFrameInterval: 10,
  enableThumbnails: true,
  thumbnailSize: 64,
};

/**
 * Calculate a simple delta between two JSON strings
 * Returns the new state if delta would be larger than original
 */
const calculateDelta = (
  oldState: string,
  newState: string,
): { delta: string; isKeyFrame: boolean } => {
  // For simplicity, we compare lengths - if new state is significantly different,
  // it's more efficient to store the full state
  const oldLength = oldState.length;
  const newLength = newState.length;

  // If states are very similar in size (within 20%), try to find a delta
  if (Math.abs(oldLength - newLength) / Math.max(oldLength, newLength) < 0.2) {
    try {
      const oldObj = JSON.parse(oldState);
      const newObj = JSON.parse(newState);

      // Simple object comparison for small deltas
      const delta = computeObjectDelta(oldObj, newObj);
      const deltaStr = JSON.stringify(delta);

      // Only use delta if it's smaller than full state
      if (deltaStr.length < newLength * 0.7) {
        return { delta: deltaStr, isKeyFrame: false };
      }
    } catch {
      // If delta computation fails, use full state
    }
  }

  return { delta: newState, isKeyFrame: true };
};

/**
 * Compute a delta between two objects
 */
const computeObjectDelta = (oldObj: any, newObj: any): any => {
  if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
    return newObj;
  }

  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    // For arrays (like objects list), compute per-item changes
    if (oldObj.length !== newObj.length) {
      return { _type: 'array_replace', value: newObj };
    }

    const changes: any[] = [];
    let hasChanges = false;

    for (let i = 0; i < newObj.length; i++) {
      if (JSON.stringify(oldObj[i]) !== JSON.stringify(newObj[i])) {
        changes.push({ index: i, value: newObj[i] });
        hasChanges = true;
      }
    }

    if (!hasChanges) return null;
    return { _type: 'array_patch', changes };
  }

  // For objects, find changed keys
  const delta: any = { _type: 'object_patch', changes: {} };
  let hasChanges = false;

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      delta.changes[key] = newObj[key];
      hasChanges = true;
    }
  }

  if (!hasChanges) return null;
  return delta;
};

/**
 * Apply a delta to reconstruct state
 */
const applyDelta = (baseState: string, delta: string): string => {
  try {
    const deltaObj = JSON.parse(delta);

    // If delta is a full state (no _type), return as-is
    if (!deltaObj._type) {
      return delta;
    }

    const baseObj = JSON.parse(baseState);

    if (deltaObj._type === 'array_replace') {
      return JSON.stringify(deltaObj.value);
    }

    if (deltaObj._type === 'array_patch' && Array.isArray(baseObj.objects)) {
      const result = { ...baseObj };
      result.objects = [...baseObj.objects];

      for (const change of deltaObj.changes) {
        result.objects[change.index] = change.value;
      }

      return JSON.stringify(result);
    }

    if (deltaObj._type === 'object_patch') {
      const result = { ...baseObj, ...deltaObj.changes };
      return JSON.stringify(result);
    }

    return delta;
  } catch {
    return delta;
  }
};

/**
 * Generate a unique ID for history entries
 */
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useHistoryOptimized = (
  canvas: Canvas | null,
  options: UseHistoryOptimizedOptions = {},
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isHistoryProcessing, setIsHistoryProcessing] = useState<boolean>(false);

  const lastSavedStateRef = useRef<string>('');
  const keyFrameCounterRef = useRef<number>(0);

  const generateThumbnail = useCallback(
    (canvasInstance: Canvas): string | undefined => {
      if (!opts.enableThumbnails) return undefined;

      try {
        return canvasInstance.toDataURL({
          format: 'png',
          multiplier: opts.thumbnailSize! / Math.max(canvasInstance.width!, canvasInstance.height!),
        });
      } catch {
        return undefined;
      }
    },
    [opts.enableThumbnails, opts.thumbnailSize],
  );

  const saveState = useCallback(
    (description?: string) => {
      if (!canvas || isHistoryProcessing) return;

      const json = JSON.stringify(canvas.toJSON());

      // Avoid saving duplicate states
      if (lastSavedStateRef.current === json) {
        return;
      }

      // Calculate delta from last state
      const isFirstEntry = history.length === 0 || historyIndex < 0;
      const forceKeyFrame = isFirstEntry || keyFrameCounterRef.current >= opts.keyFrameInterval!;

      let entry: HistoryEntry;

      if (forceKeyFrame) {
        // Save full snapshot
        entry = {
          id: generateId(),
          timestamp: Date.now(),
          snapshot: json,
          description,
          thumbnail: generateThumbnail(canvas),
        };
        keyFrameCounterRef.current = 0;
      } else {
        // Save delta from previous state
        const { delta, isKeyFrame } = calculateDelta(lastSavedStateRef.current, json);

        entry = {
          id: generateId(),
          timestamp: Date.now(),
          snapshot: isKeyFrame ? json : '',
          delta: isKeyFrame ? undefined : delta,
          description,
          thumbnail: generateThumbnail(canvas),
        };

        if (isKeyFrame) {
          keyFrameCounterRef.current = 0;
        } else {
          keyFrameCounterRef.current++;
        }
      }

      lastSavedStateRef.current = json;

      // If we are in the middle of the history, discard the future
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(entry);

      // Limit history size
      while (newHistory.length > opts.maxEntries!) {
        newHistory.shift();
      }

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [
      canvas,
      history,
      historyIndex,
      isHistoryProcessing,
      opts.keyFrameInterval,
      opts.maxEntries,
      generateThumbnail,
    ],
  );

  /**
   * Reconstruct state at a given index by applying deltas from the nearest key frame
   */
  const reconstructState = useCallback(
    (targetIndex: number): string | null => {
      if (targetIndex < 0 || targetIndex >= history.length) return null;

      // Find the nearest key frame before or at targetIndex
      let keyFrameIndex = targetIndex;
      while (keyFrameIndex >= 0 && !history[keyFrameIndex].snapshot) {
        keyFrameIndex--;
      }

      if (keyFrameIndex < 0) return null;

      let state = history[keyFrameIndex].snapshot;

      // Apply deltas forward to reach target index
      for (let i = keyFrameIndex + 1; i <= targetIndex; i++) {
        const entry = history[i];
        if (entry.snapshot) {
          state = entry.snapshot;
        } else if (entry.delta) {
          state = applyDelta(state, entry.delta);
        }
      }

      return state;
    },
    [history],
  );

  const undo = useCallback(() => {
    if (!canvas || historyIndex <= 0 || isHistoryProcessing) return;

    setIsHistoryProcessing(true);
    const newIndex = historyIndex - 1;
    const state = reconstructState(newIndex);

    if (state) {
      canvas
        .loadFromJSON(JSON.parse(state))
        .then(() => {
          canvas.renderAll();
          setHistoryIndex(newIndex);
          lastSavedStateRef.current = state;
          setIsHistoryProcessing(false);
        })
        .catch(() => {
          setIsHistoryProcessing(false);
        });
    } else {
      setIsHistoryProcessing(false);
    }
  }, [canvas, historyIndex, isHistoryProcessing, reconstructState]);

  const redo = useCallback(() => {
    if (!canvas || historyIndex >= history.length - 1 || isHistoryProcessing) return;

    setIsHistoryProcessing(true);
    const newIndex = historyIndex + 1;
    const state = reconstructState(newIndex);

    if (state) {
      canvas
        .loadFromJSON(JSON.parse(state))
        .then(() => {
          canvas.renderAll();
          setHistoryIndex(newIndex);
          lastSavedStateRef.current = state;
          setIsHistoryProcessing(false);
        })
        .catch(() => {
          setIsHistoryProcessing(false);
        });
    } else {
      setIsHistoryProcessing(false);
    }
  }, [canvas, history.length, historyIndex, isHistoryProcessing, reconstructState]);

  /**
   * Jump to a specific history entry
   */
  const goToEntry = useCallback(
    (entryId: string) => {
      if (!canvas || isHistoryProcessing) return;

      const targetIndex = history.findIndex((e) => e.id === entryId);
      if (targetIndex < 0 || targetIndex === historyIndex) return;

      setIsHistoryProcessing(true);
      const state = reconstructState(targetIndex);

      if (state) {
        canvas
          .loadFromJSON(JSON.parse(state))
          .then(() => {
            canvas.renderAll();
            setHistoryIndex(targetIndex);
            lastSavedStateRef.current = state;
            setIsHistoryProcessing(false);
          })
          .catch(() => {
            setIsHistoryProcessing(false);
          });
      } else {
        setIsHistoryProcessing(false);
      }
    },
    [canvas, history, historyIndex, isHistoryProcessing, reconstructState],
  );

  // Auto-save on canvas events
  useEffect(() => {
    if (!canvas) return;

    const handleSave = () => {
      saveState();
    };

    canvas.on('object:modified', handleSave);
    canvas.on('object:added', handleSave);
    canvas.on('object:removed', handleSave);
    canvas.on('path:created', handleSave);

    return () => {
      canvas.off('object:modified', handleSave);
      canvas.off('object:added', handleSave);
      canvas.off('object:removed', handleSave);
      canvas.off('path:created', handleSave);
    };
  }, [canvas, saveState]);

  return {
    saveState,
    undo,
    redo,
    goToEntry,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    entries: history,
    currentIndex: historyIndex,
    isProcessing: isHistoryProcessing,
  };
};

export default useHistoryOptimized;
