import { useEffect, useRef } from 'react';
import { Canvas, FabricObject } from 'fabric';

// Arrow key smooth movement via rAF loop
const ACCEL_DELAY = 300; // ms before acceleration kicks in
const BASE_SPEED = 40; // px per second at start
const MAX_SPEED = 800; // px per second at full ramp
const ACCEL_RAMP = 1500; // ms to ramp from base → max
const SHIFT_SPEED = 400; // px per second when holding Shift

export const useKeyboardShortcuts = (canvas: Canvas | null) => {
  const clipboard = useRef<FabricObject | null>(null);
  // Track which arrow keys are currently held
  const arrowKeysRef = useRef<Set<string>>(new Set());
  const arrowShiftRef = useRef(false);
  const arrowStartRef = useRef(0); // timestamp when first arrow pressed
  const rafIdRef = useRef(0);
  const lastFrameRef = useRef(0);
  // Accumulate sub-pixel movement for precision
  const accumRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvas) return;

    const getSpeed = (): number => {
      if (arrowShiftRef.current) return SHIFT_SPEED;
      const elapsed = Date.now() - arrowStartRef.current;
      if (elapsed < ACCEL_DELAY) return BASE_SPEED;
      const t = Math.min((elapsed - ACCEL_DELAY) / ACCEL_RAMP, 1);
      // Ease-out for smooth feel
      const eased = 1 - (1 - t) * (1 - t);
      return BASE_SPEED + eased * (MAX_SPEED - BASE_SPEED);
    };

    const tick = (timestamp: number) => {
      const activeObject = canvas.getActiveObject();
      const keys = arrowKeysRef.current;

      if (!activeObject || keys.size === 0) {
        rafIdRef.current = 0;
        lastFrameRef.current = 0;
        return;
      }

      if (lastFrameRef.current === 0) {
        lastFrameRef.current = timestamp;
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05); // cap at 50ms
      lastFrameRef.current = timestamp;

      const speed = getSpeed();
      const dist = speed * dt;

      let dx = 0;
      let dy = 0;
      if (keys.has('ArrowLeft')) dx -= dist;
      if (keys.has('ArrowRight')) dx += dist;
      if (keys.has('ArrowUp')) dy -= dist;
      if (keys.has('ArrowDown')) dy += dist;

      // Accumulate sub-pixel
      accumRef.current.x += dx;
      accumRef.current.y += dy;

      const moveX = Math.trunc(accumRef.current.x);
      const moveY = Math.trunc(accumRef.current.y);

      if (moveX !== 0 || moveY !== 0) {
        accumRef.current.x -= moveX;
        accumRef.current.y -= moveY;
        activeObject.set('left', (activeObject.left || 0) + moveX);
        activeObject.set('top', (activeObject.top || 0) + moveY);
        activeObject.setCoords();
        canvas.requestRenderAll();
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafIdRef.current === 0) {
        lastFrameRef.current = 0;
        accumRef.current = { x: 0, y: 0 };
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        arrowKeysRef.current.delete(e.key);
        if (arrowKeysRef.current.size === 0) {
          // Fire modified once when all arrow keys released (for undo history)
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = 0;
          }
          const obj = canvas.getActiveObject();
          if (obj) canvas.fire('object:modified', { target: obj });
          arrowStartRef.current = 0;
        }
      }
    };

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

      // Move selected layer with arrow keys (smooth rAF loop)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          e.preventDefault();
          arrowShiftRef.current = e.shiftKey;
          if (!arrowKeysRef.current.has(e.key)) {
            arrowKeysRef.current.add(e.key);
            if (arrowStartRef.current === 0) arrowStartRef.current = Date.now();
            startLoop();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [canvas]);
};
