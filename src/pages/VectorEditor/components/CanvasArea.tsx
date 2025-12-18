import React, { useEffect, useRef } from 'react';
import { Canvas, TEvent, Rect, Circle, IText, Point } from 'fabric';
import { useVectorEditor } from '../context';
import { useShortcuts } from '../hooks/useShortcuts';
import { usePenTool } from '../hooks/usePenTool';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject, activeTool, setActiveTool, history, canvas } =
    useVectorEditor();

  const penTool = usePenTool(canvas, history.saveState);

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
    const saveHistory = (e: any) => {
      // specific check for temp objects from pen tool
      if (e.target && e.target.isTemp) return;
      history.saveState();
    };

    fabricCanvas.on('object:modified', saveHistory);
    fabricCanvas.on('object:added', saveHistory);
    fabricCanvas.on('object:removed', saveHistory);

    // Zoom
    fabricCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      fabricCanvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

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

    canvas.isDrawingMode = false;

    if (activeTool === 'pan') {
      canvas.defaultCursor = 'grab';
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else if (activeTool === 'pen') {
      canvas.defaultCursor = 'crosshair';
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

  // Bind Pen Events
  useEffect(() => {
    if (!canvas || activeTool !== 'pen') return;

    const onMouseDown = (opt: any) => penTool.onMouseDown(opt);
    const onMouseMove = (opt: any) => penTool.onMouseMove(opt);
    const onMouseUp = (opt: any) => penTool.onMouseUp(opt);
    const onDoubleClick = (opt: any) => penTool.onDoubleClick(opt);

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('mouse:dblclick', onDoubleClick);

    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      canvas.off('mouse:dblclick', onDoubleClick);
    };
  }, [canvas, activeTool, penTool]);

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
    p: () => setActiveTool('pen'),
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
