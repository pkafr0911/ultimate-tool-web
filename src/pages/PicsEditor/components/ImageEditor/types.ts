import { EditorState, EditorSettings } from '../../types';

export type Tool =
  | 'pan'
  | 'crop'
  | 'color'
  | 'ruler'
  | 'perspective'
  | 'select'
  | 'draw'
  | 'layer'
  | 'upscale'
  | 'text'
  | 'removeColor';

export type ImageEditorProps = {
  imageUrl: string;
  addOnFile?: File | null;
  setAddOnFile: React.Dispatch<React.SetStateAction<File | null>>;
  onExport?: (blob: Blob) => void;
  onSave?: (state: EditorState) => void;
  initialState?: EditorState | null;
  settings: EditorSettings;
};
