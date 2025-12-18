import React, { useEffect, useRef } from 'react';
import { Canvas, TEvent, Rect, Circle, IText } from 'fabric';
import { useVectorEditor } from '../context';
import { useShortcuts } from '../hooks/useShortcuts';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, activeTool, setActiveTool, history, canvas } =
    useVectorEditor();

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      selection: true,
    });

    setCanvas(fabricCanvas);

    // Event listeners
    const updateSelection = () => {
      const activeObjects = fabricCanvas.getActiveObjects();
      if (activeObjects.length === 1) {
        setSelectedObject(activeObjects[0]);
      } else {
        setSelectedObject(null);
      }
    };

    fabricCanvas.on('selection:created', updateSelection);
    fabricCanvas.on('selection:updated', updateSelection);
    fabricCanvas.on('selection:cleared', () => setSelectedObject(null));

    // Save state on modification
    fabricCanvas.on('object:modified', () => history.saveState());
    fabricCanvas.on('object:added', () => history.saveState());
    fabricCanvas.on('object:removed', () => history.saveState());

    const handleResize = () => {
      if (containerRef.current) {
        fabricCanvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle Tool Changes
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'draw';

    if (activeTool === 'pan') {
      canvas.defaultCursor = 'grab';
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      canvas.defaultCursor = 'default';
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    }

    canvas.requestRenderAll();
  }, [activeTool, canvas]);

  // Shortcuts
  useShortcuts({
    v: () => setActiveTool('select'),
    h: () => setActiveTool('pan'),
    ' ': () => setActiveTool('pan'), // Space for pan
    r: () => {
      if (!canvas) return;
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: '#ff0000',
        width: 100,
        height: 100,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      setActiveTool('select');
    },
    c: () => {
      if (!canvas) return;
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: '#00ff00',
        radius: 50,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      setActiveTool('select');
    },
    t: () => {
      if (!canvas) return;
      const text = new IText('Type here', {
        left: 100,
        top: 100,
        fontFamily: 'arial',
        fill: '#333',
        fontSize: 20,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      setActiveTool('select');
    },
    b: () => setActiveTool('draw'),
    delete: () => {
      if (!canvas) return;
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length) {
        canvas.discardActiveObject();
        activeObjects.forEach((obj) => {
          canvas.remove(obj);
        });
        canvas.requestRenderAll();
      }
    },
    backspace: () => {
      if (!canvas) return;
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length) {
        canvas.discardActiveObject();
        activeObjects.forEach((obj) => {
          canvas.remove(obj);
        });
        canvas.requestRenderAll();
      }
    },
    'ctrl+z': () => history.undo(),
    'ctrl+shift+z': () => history.redo(),
    'ctrl+=': () => {
      // Zoom In
      if (!canvas) return;
      canvas.setZoom(canvas.getZoom() * 1.1);
    },
    'ctrl+-': () => {
      // Zoom Out
      if (!canvas) return;
      canvas.setZoom(canvas.getZoom() * 0.9);
    },
    'ctrl+0': () => {
      // Reset Zoom
      if (!canvas) return;
      canvas.setZoom(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    },
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default CanvasArea;
