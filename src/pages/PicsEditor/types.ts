export type Layer = {
  id: string;
  type: 'image' | 'text';
  img?: HTMLImageElement;
  rect: { x: number; y: number; w: number; h: number };
  opacity: number;
  blend: GlobalCompositeOperation;
  rotation?: number;
  text?: string;
  font?: string;
  fontSize?: number;
  fontWeight?:
    | 'normal'
    | 'bold'
    | 'lighter'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  fontItalic?: boolean;
  textDecoration?: 'none' | 'underline' | 'line-through';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  locked?: boolean;
  mask?: HTMLCanvasElement;
};

export interface EditorState {
  layers: Layer[];
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  vibrance: number;
  saturation: number;
  dehaze: number;
  blur: number;
  gaussian: number;
  sharpen: number;
  texture: number;
  clarity: number;
  bgThreshold: number;
  bgThresholdBlack: number;
  hslAdjustments: Record<string, { h?: number; s?: number; l?: number }>;
}

export interface EditorSettings {
  autoSaveInterval: number; // in minutes
  maxHistory: number;
}

export interface SavedProject {
  id: string;
  name: string;
  thumbnail: string;
  baseImage: string;
  state: EditorState;
  createdAt: number;
  updatedAt: number;
}
