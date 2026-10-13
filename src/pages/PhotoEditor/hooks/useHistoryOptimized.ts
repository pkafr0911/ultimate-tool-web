import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { message } from 'antd';
import {
  isDocumentLoading,
  loadDocument,
  serializeDocument,
  renderDocument,
} from '../utils/document';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  snapshot: string;
  description?: string;
  thumbnail?: string;
}
export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  isProcessing: boolean;
}
interface Options {
  maxEntries?: number;
  keyFrameInterval?: number;
  enableThumbnails?: boolean;
  thumbnailSize?: number;
}

// Independent snapshots make eviction safe. Synchronous refs prevent stale closures
// and a microtask coalesces add/remove/path events into one complete command.
export const useHistoryOptimized = (canvas: Canvas | null, options: Options = {}) => {
  const state = useRef<HistoryState>({ entries: [], currentIndex: -1, isProcessing: false });
  const [view, setView] = useState(state.current);
  const pending = useRef(false);
  const generation = useRef(0);
  const thumbnails = options.enableThumbnails ?? false;
  const thumbnailSize = options.thumbnailSize ?? 64;
  const maxEntries = options.maxEntries ?? 50;
  const publish = useCallback(() => setView({ ...state.current }), []);
  const saveState = useCallback(
    (description?: string) => {
      pending.current = false;
      if (!canvas || canvas.disposed || state.current.isProcessing || isDocumentLoading(canvas))
        return;
      const snapshot = JSON.stringify(serializeDocument(canvas));
      const current = state.current;
      if (current.entries[current.currentIndex]?.snapshot === snapshot) return;
      const entries = current.entries.slice(0, current.currentIndex + 1);
      let thumbnail: string | undefined;
      if (thumbnails) {
        try {
          const data = JSON.parse(snapshot);
          thumbnail = renderDocument(
            canvas,
            thumbnailSize / Math.max(data.documentWidth, data.documentHeight),
          ).toDataURL();
        } catch {
          /* History remains usable when preview rendering fails. */
        }
      }
      entries.push({
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        snapshot,
        description,
        thumbnail,
      });
      let bytes = entries.reduce((sum, entry) => sum + entry.snapshot.length * 2, 0);
      while (entries.length > 2 && (entries.length > maxEntries || bytes > 64 * 1024 * 1024)) {
        bytes -= entries.shift()!.snapshot.length * 2;
      }
      state.current = { entries, currentIndex: entries.length - 1, isProcessing: false };
      publish();
    },
    [canvas, maxEntries, thumbnails, thumbnailSize, publish],
  );

  const restore = useCallback(
    async (index: number) => {
      if (!canvas || canvas.disposed || state.current.isProcessing || isDocumentLoading(canvas))
        return;
      const entry = state.current.entries[index];
      if (!entry || index === state.current.currentIndex) return;
      pending.current = false;
      state.current.isProcessing = true;
      publish();
      const epoch = generation.current;
      try {
        await loadDocument(canvas, entry.snapshot);
        if (epoch === generation.current) state.current.currentIndex = index;
      } catch {
        message.error('Unable to restore this history entry. The current document was retained.');
      } finally {
        if (epoch === generation.current) {
          state.current.isProcessing = false;
          publish();
        }
      }
    },
    [canvas, publish],
  );

  const undo = useCallback(() => {
    if (pending.current) saveState();
    void restore(state.current.currentIndex - 1);
  }, [restore, saveState]);
  const redo = useCallback(() => {
    if (pending.current) saveState();
    void restore(state.current.currentIndex + 1);
  }, [restore, saveState]);
  const goToEntry = useCallback(
    (id: string) => {
      if (pending.current) saveState();
      void restore(state.current.entries.findIndex((e) => e.id === id));
    },
    [restore, saveState],
  );
  useEffect(() => {
    generation.current++;
    state.current = { entries: [], currentIndex: -1, isProcessing: false };
    publish();
    if (!canvas) return;
    saveState('Initial document');
    const epoch = generation.current;
    const schedule = () => {
      if (pending.current || state.current.isProcessing || isDocumentLoading(canvas)) return;
      pending.current = true;
      queueMicrotask(() => {
        if (pending.current && epoch === generation.current) saveState();
      });
    };
    const disposers = [
      canvas.on('object:modified', schedule),
      canvas.on('object:added', schedule),
      canvas.on('object:removed', schedule),
      canvas.on('path:created', schedule),
      canvas.on('text:editing:exited', schedule),
    ];
    return () => {
      generation.current++;
      pending.current = false;
      disposers.forEach((dispose) => dispose());
    };
  }, [canvas, saveState, publish]);
  return {
    saveState,
    undo,
    redo,
    goToEntry,
    entries: view.entries,
    currentIndex: view.currentIndex,
    isProcessing: view.isProcessing,
    canUndo: !view.isProcessing && view.currentIndex > 0,
    canRedo: !view.isProcessing && view.currentIndex < view.entries.length - 1,
  };
};
export default useHistoryOptimized;
