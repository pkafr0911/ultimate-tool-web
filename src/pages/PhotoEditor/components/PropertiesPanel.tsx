import React from 'react';
import { usePhotoEditor } from '../context';
import AdjustmentPanel from './AdjustmentPanel';
import BrushPanel from './BrushPanel';

const PropertiesPanel: React.FC = () => {
  const { activeTool } = usePhotoEditor();

  return activeTool === 'brush' ? <BrushPanel /> : <AdjustmentPanel />;
};

export default PropertiesPanel;
