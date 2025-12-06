import { useState, useRef } from 'react';

export const useCrop = () => {
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const cropStart = useRef<{ x: number; y: number } | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  return {
    cropRect,
    setCropRect,
    cropStart,
    showCropModal,
    setShowCropModal,
  };
};
