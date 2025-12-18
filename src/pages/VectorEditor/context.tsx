import React, { createContext, useContext, useState } from 'react';
import { Canvas, FabricObject } from 'fabric';

interface VectorEditorContextType {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (object: FabricObject | null) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

const VectorEditorContext = createContext<VectorEditorContextType | undefined>(undefined);

export const VectorEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');

  return (
    <VectorEditorContext.Provider
      value={{
        canvas,
        setCanvas,
        selectedObject,
        setSelectedObject,
        activeTool,
        setActiveTool,
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
