import { useEffect, useRef } from 'react';
import { Canvas, FabricObject } from 'fabric';

export const useKeyboardShortcuts = (canvas: Canvas | null) => {
  const clipboard = useRef<FabricObject | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          const cloned = await activeObject.clone();
          clipboard.current = cloned;
        }
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboard.current) {
          const clonedObj = await clipboard.current.clone();
          canvas.discardActiveObject();

          clonedObj.set({
            left: (clonedObj.left || 0) + 10,
            top: (clonedObj.top || 0) + 10,
            evented: true,
          });

          if (clonedObj.type === 'activeSelection') {
            // active selection needs a reference to the canvas.
            clonedObj.canvas = canvas;
            (clonedObj as any).forEachObject((obj: any) => {
              canvas.add(obj);
            });
            clonedObj.setCoords();
          } else {
            canvas.add(clonedObj);
          }

          clipboard.current = clonedObj; // Update clipboard to allow multiple pastes with offset
          canvas.setActiveObject(clonedObj);
          canvas.requestRenderAll();
        }
      }

      // Brush Size
      if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
        if (e.key === '[') {
          canvas.freeDrawingBrush.width = Math.max(1, canvas.freeDrawingBrush.width - 5);
        } else if (e.key === ']') {
          canvas.freeDrawingBrush.width += 5;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas]);
};
