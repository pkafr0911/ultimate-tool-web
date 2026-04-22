import React, { createContext, useContext, useState } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { useHistory } from './hooks/useHistory';

// Type for the point editor returned by usePointEditor
interface PointEditor {
  isEditing: boolean;
  selectedAnchorIndex: number | null;
  editingObject: FabricObject | null;
  enter: (object: FabricObject) => void;
  exit: (commit?: boolean) => void;
  selectAnchor: (index: number | null) => void;
  moveAnchor: (index: number, newX: number, newY: number) => void;
  moveHandle: (
    index: number,
    cpType: 'cp1' | 'cp2',
    newX: number,
    newY: number,
    breakSymmetry?: boolean,
  ) => void;
  addPoint: (globalX: number, globalY: number) => number | null;
  removePoint: (index: number) => void;
  convertPointType: (index: number, type: 'smooth' | 'corner') => void;
  getAnchors: () => Array<{
    x: number;
    y: number;
    cp1?: { x: number; y: number };
    cp2?: { x: number; y: number };
    type: 'corner' | 'smooth';
  }>;
}

interface CursorPos {
  x: number;
  y: number;
}

interface VectorEditorContextType {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas) => void;
  selectedObject: FabricObject | null;
  setSelectedObject: (object: FabricObject | null) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  /** Default fill colour applied when creating new shapes */
  defaultFill: string;
  setDefaultFill: (color: string) => void;
  /** Default stroke colour applied when creating new shapes */
  defaultStroke: string;
  setDefaultStroke: (color: string) => void;
  /** Live zoom value (1 = 100%) — driven by CanvasArea */
  zoom: number;
  setZoom: (z: number) => void;
  /** Live cursor position in canvas (logical) coords */
  cursor: CursorPos;
  setCursor: (p: CursorPos) => void;
  history: {
    saveState: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
  pointEditor: PointEditor | null;
  setPointEditor: (editor: PointEditor | null) => void;
}

const VectorEditorContext = createContext<VectorEditorContextType | undefined>(undefined);

export const VectorEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [pointEditor, setPointEditor] = useState<PointEditor | null>(null);
  const [defaultFill, setDefaultFill] = useState<string>('#4096ff');
  const [defaultStroke, setDefaultStroke] = useState<string>('#1f1f1f');
  const [zoom, setZoom] = useState<number>(1);
  const [cursor, setCursor] = useState<CursorPos>({ x: 0, y: 0 });

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
        defaultFill,
        setDefaultFill,
        defaultStroke,
        setDefaultStroke,
        zoom,
        setZoom,
        cursor,
        setCursor,
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
