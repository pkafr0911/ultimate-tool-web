import { useState, useRef } from 'react';

export const usePerspective = () => {
  const [showPerspectiveModal, setShowPerspectiveModal] = useState(false);

  // initialize to NaN pairs so we can detect "empty" slots
  const perspectivePoints = useRef<
    [number, number, number, number, number, number, number, number] | null
  >(null);

  // helper: ensure we have an array of 8 numbers (NaNs if empty)
  const ensurePerspectiveInit = () => {
    if (!perspectivePoints.current) {
      perspectivePoints.current = [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
    }
  };

  // helper: find index of a "near" point (within tolerance), else -1
  const findNearPointIndex = (x: number, y: number, tol = 12) => {
    if (!perspectivePoints.current) return -1;
    const p = perspectivePoints.current;
    for (let i = 0; i < 8; i += 2) {
      const px = p[i];
      const py = p[i + 1];
      if (!isNaN(px) && !isNaN(py)) {
        const dx = px - x;
        const dy = py - y;
        if (Math.sqrt(dx * dx + dy * dy) <= tol) return i;
      }
    }
    return -1;
  };

  return {
    showPerspectiveModal,
    setShowPerspectiveModal,
    perspectivePoints,
    ensurePerspectiveInit,
    findNearPointIndex,
  };
};
