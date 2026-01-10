import React, { createContext, useContext, useState } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { useHistory } from './hooks/useHistory';

interface VectorEditorContextType {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (object: FabricObject | null) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  history: {
    saveState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
  pointEditor: any;
  setPointEditor: (editor: any) => void;
}

const VectorEditorContext = createContext<VectorEditorContextType | undefined>(undefined);

export const VectorEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [pointEditor, setPointEditor] = useState<any>(null);

  const history = useHistory(canvas);

  return (
    <VectorEditorContext.Provider
      value={{
        canvas,
        setCanvas,
        selectedObject,
        setSelectedObject,
        activeTool,
        setActiveTool,
        history,
        pointEditor,
        setPointEditor,
      }}
    >
      {children}
    </VectorEditorContext.Provider>
  );
};

export const useVectorEditor = () => {
  const context = useContext(VectorEditorContext);
  if (!context) {
    throw new Error('useVectorEditor must be used within a VectorEditorProvider');
  }
  return context;
};
