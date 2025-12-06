import { useState } from 'react';
import { Tool } from '../types';

export const useTools = () => {
  const [tool, setTool] = useState<Tool>('pan');
  const [toolBefore, setToolBefore] = useState<Tool | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isAltDown, setIsAltDown] = useState(false);
  const [isShiftDown, setIsShiftDown] = useState(false);

  return {
    tool,
    setTool,
    toolBefore,
    setToolBefore,
    isSpaceDown,
    setIsSpaceDown,
    isAltDown,
    setIsAltDown,
    isShiftDown,
    setIsShiftDown,
  };
};
