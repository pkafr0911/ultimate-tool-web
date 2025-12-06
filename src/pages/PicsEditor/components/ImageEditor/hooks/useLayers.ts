import { useState, useRef } from 'react';
import { Layer } from '../../../types';

export const useLayers = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [overlaySelected, setOverlaySelected] = useState(false);

  const overlayDrag = useRef<null | {
    layerId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>(null);

  const overlayResize = useRef<null | {
    layerId: string;
    handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';
    startX: number;
    startY: number;
    orig: { x: number; y: number; w: number; h: number };
  }>(null);

  const overlayRotate = useRef<null | {
    layerId: string;
    startX: number;
    startY: number;
    centerX: number;
    centerY: number;
    startAngle: number;
    originalRotation: number;
  }>(null);

  return {
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    overlaySelected,
    setOverlaySelected,
    overlayDrag,
    overlayResize,
    overlayRotate,
  };
};
