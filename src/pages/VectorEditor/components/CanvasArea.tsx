import React, { useEffect, useRef } from 'react';
import { Canvas, TEvent, Rect, Circle, IText, Point } from 'fabric';
import { useVectorEditor } from '../context';
import { useShortcuts } from '../hooks/useShortcuts';
import { usePenTool } from '../hooks/usePenTool';
import { usePointEditor } from '../hooks/usePointEditor';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    setCanvas,
    setSelectedObject,
    activeTool,
    setActiveTool,
    history,
    canvas,
    setPointEditor,
  } = useVectorEditor();

  const penTool = usePenTool(canvas, history.saveState);

  const pointEditor = usePointEditor(canvas, history, {
    onChange: (event) => {
      console.log('Point edit:', event);
    },
    onCommit: (object) => {
      console.log('Committed changes to:', object);
    },
  });

  // Expose point editor to context
  useEffect(() => {
    if (canvas) {
      setPointEditor(pointEditor);
    }
  }, [canvas, pointEditor, setPointEditor]);

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

    console.log('Active tool changed to:', activeTool);

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
    v: () => {
      console.log('V key pressed - switching to select tool');
      // Selection Tool - exit point edit mode if active
      if (pointEditor.isEditing) {
        pointEditor.exit(true);
      }
      setActiveTool('select');
    },
    h: () => {
      console.log('H key pressed - switching to pan tool');
      setActiveTool('pan');
    },
    ' ': () => {
      console.log('Space key pressed - switching to pan tool');
      setActiveTool('pan');
    }, // Space for pan
    a: () => {
      console.log('A key pressed - attempting to enter point edit mode');
      // Direct Selection Tool - enter point edit mode
      const activeObj = canvas?.getActiveObject();
      console.log('Active object:', activeObj);
      console.log('Point editor is editing:', pointEditor.isEditing);
      console.log('Canvas exists:', !!canvas);

      if (!canvas) {
        console.log('No canvas available');
        return;
      }

      if (!activeObj) {
        console.log('No object selected - cannot enter point edit mode');
        return;
      }

      if (pointEditor.isEditing) {
        console.log('Already in point edit mode');
        return;
      }

      console.log('Entering point edit mode for object:', activeObj.type);
      pointEditor.enter(activeObj);
    },
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
    p: () => {
      console.log('P key pressed - switching to pen tool');
      setActiveTool('pen');
    },
    'shift+c': () => {
      // Convert anchor type
      if (pointEditor.isEditing && pointEditor.selectedAnchorIndex !== null) {
        const current = pointEditor.getAnchors()[pointEditor.selectedAnchorIndex];
        const newType = current.type === 'smooth' ? 'corner' : 'smooth';
        pointEditor.convertPointType(pointEditor.selectedAnchorIndex, newType);
      }
    },
    enter: () => {
      // Commit point edit
      if (pointEditor.isEditing) {
        pointEditor.exit(true);
      }
    },
    escape: () => {
      // Cancel point edit
      if (pointEditor.isEditing) {
        pointEditor.exit(false);
      }
    },
    delete: () => {
      if (!canvas) return;

      // If in point edit mode and anchor selected, delete the anchor
      if (pointEditor.isEditing && pointEditor.selectedAnchorIndex !== null) {
        pointEditor.removePoint(pointEditor.selectedAnchorIndex);
        return;
      }

      // Otherwise delete selected objects
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

      // If in point edit mode and anchor selected, delete the anchor
      if (pointEditor.isEditing && pointEditor.selectedAnchorIndex !== null) {
        pointEditor.removePoint(pointEditor.selectedAnchorIndex);
        return;
      }

      // Otherwise delete selected objects
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
