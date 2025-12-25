import React, { createContext, useContext, useState } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { useHistory } from './hooks/useHistory';

interface PhotoEditorContextType {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (object: FabricObject | null) => void;
  history: {
    saveState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
  clipboard: FabricObject | null;
  setClipboard: (object: FabricObject | null) => void;
  imageUrl?: string | null;
  initialProject?: any;
  addOnFile?: File | null;
  setAddOnFile?: (file: File | null) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
}

const PhotoEditorContext = createContext<PhotoEditorContextType | undefined>(undefined);

export const PhotoEditorProvider: React.FC<{
  children: React.ReactNode;
  imageUrl?: string | null;
  initialProject?: any;
  addOnFile?: File | null;
  setAddOnFile?: (file: File | null) => void;
}> = ({ children, imageUrl, initialProject, addOnFile, setAddOnFile }) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [clipboard, setClipboard] = useState<FabricObject | null>(null);
  const [brushSize, setBrushSize] = useState<number>(5);
  const [brushColor, setBrushColor] = useState<string>('#000000');

  const history = useHistory(canvas);

  return (
    <PhotoEditorContext.Provider
      value={{
        canvas,
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
        brushSize,
        setBrushSize,
        brushColor,
        setBrushColor,
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
