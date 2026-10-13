import React, { createContext, useContext, useState, useEffect } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { useHistoryOptimized, HistoryEntry } from './hooks/useHistoryOptimized';

interface PhotoEditorContextType {
  canvas: Canvas | null;
  isBusy: boolean;
  importFile?: (file: File) => void;
  setCanvas: (canvas: Canvas) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (object: FabricObject | null) => void;
  history: {
    saveState: (description?: string) => void;
    undo: () => void;
    redo: () => void;
    goToEntry: (entryId: string) => void;
    canUndo: boolean;
    canRedo: boolean;
    entries: HistoryEntry[];
    currentIndex: number;
    isProcessing: boolean;
  };
  clipboard: FabricObject | null;
  setClipboard: (object: FabricObject | null) => void;
  imageUrl?: string | null;
  initialProject?: any;
  addOnFile?: File | null;
  setAddOnFile?: (file: File | null) => void;
  brushType: string;
  setBrushType: (type: string) => void;
  brushShadow: number;
  setBrushShadow: (value: number) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
}

const PhotoEditorContext = createContext<PhotoEditorContextType | undefined>(undefined);

export const PhotoEditorProvider: React.FC<{
  children: React.ReactNode;
  importFile?: (file: File) => void;
  imageUrl?: string | null;
  initialProject?: any;
  addOnFile?: File | null;
  setAddOnFile?: (file: File | null) => void;
}> = ({ children, importFile, imageUrl, initialProject, addOnFile, setAddOnFile }) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  useEffect(() => {
    if (!canvas) return;
    return (canvas as any).on('document:loading', (event: { loading: boolean }) => setDocumentLoading(event.loading));
  }, [canvas]);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);
  const [brushType, setBrushType] = useState('Pencil');
  const [brushShadow, setBrushShadow] = useState(0);
  const [brushSize, setBrushSize] = useState<number>(5);
  const [brushColor, setBrushColor] = useState<string>('#000000');
  const [brushOpacity, setBrushOpacity] = useState<number>(1);

  useEffect(() => {
    if (!canvas) return;
    return canvas.on('object:added', ({ target }) => { if (!(target as any).uid) target.set('uid' as any, crypto.randomUUID()); });
  }, [canvas]);

  const history = useHistoryOptimized(canvas, {
    maxEntries: 50,
    keyFrameInterval: 10,
    enableThumbnails: true,
    thumbnailSize: 64,
  });

  return (
    <PhotoEditorContext.Provider
      value={{
        canvas,
        importFile,
        isBusy: documentLoading || history.isProcessing,
        setCanvas,
        activeTool,
        setActiveTool,
        selectedObject,
        setSelectedObject,
        history,
        clipboard,
        setClipboard,
        imageUrl,
        initialProject,
        addOnFile,
        setAddOnFile,
        brushType, setBrushType, brushShadow, setBrushShadow,
        brushSize,
        setBrushSize,
        brushColor,
        setBrushColor,
        brushOpacity,
        setBrushOpacity,
      }}
    >
      {children}
    </PhotoEditorContext.Provider>
  );
};
export const usePhotoEditor = () => {
  const context = useContext(PhotoEditorContext);
  if (!context) {
    throw new Error('usePhotoEditor must be used within a PhotoEditorProvider');
  }
  return context;
};
