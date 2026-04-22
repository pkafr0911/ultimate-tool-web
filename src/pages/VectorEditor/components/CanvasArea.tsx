import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, Point, Path, ActiveSelection } from 'fabric';
import { useVectorEditor } from '../context';
import { useShortcuts } from '../hooks/useShortcuts';
import { usePenTool } from '../hooks/usePenTool';
import { usePointEditor } from '../hooks/usePointEditor';
import { makeRect, makeCircle, makeText } from '../utils/shapes';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    setCanvas,
    setSelectedObject,
    selectedObject,
    activeTool,
    setActiveTool,
    history,
    canvas,
    setPointEditor,
    setZoom,
    setCursor,
    defaultFill,
    defaultStroke,
  } = useVectorEditor();

  const penTool = usePenTool(canvas, history.saveState);
  const pointEditor = usePointEditor(canvas, history, {
    onChange: () => {},
    onCommit: () => {},
  });

  // Pan state
  const isPanningRef = useRef(false);
  const panLastRef = useRef<{ x: number; y: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const prevToolRef = useRef<string>('select');
  const [spacePan, setSpacePan] = useState(false);

  // Keep toolbar in sync with pen edit mode
  useEffect(() => {
    if (penTool.isEditMode) setActiveTool('pen');
  }, [penTool.isEditMode, setActiveTool]);

  // Expose point editor to context
  useEffect(() => {
    if (canvas) setPointEditor(pointEditor);
  }, [canvas, pointEditor, setPointEditor]);

  // Seed history with the empty canvas so the first edit is undoable
  useEffect(() => {
    if (canvas) history.saveState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  // Initialize Canvas (once)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    const updateSelection = () => {
      const actives = fabricCanvas.getActiveObjects();
      setSelectedObject(actives.length === 1 ? actives[0] : null);
    };

    fabricCanvas.on('selection:created', updateSelection);
    fabricCanvas.on('selection:updated', updateSelection);
    fabricCanvas.on('selection:cleared', () => setSelectedObject(null));

    const saveHistory = (e: any) => {
      if (e?.target?.isTemp) return;
      history.saveState();
    };

    fabricCanvas.on('object:modified', saveHistory);
    fabricCanvas.on('object:added', saveHistory);
    fabricCanvas.on('object:removed', saveHistory);

    // Zoom (wheel)
    fabricCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let z = fabricCanvas.getZoom();
      z *= 0.999 ** delta;
      if (z > 20) z = 20;
      if (z < 0.02) z = 0.02;
      fabricCanvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), z);
      setZoom(z);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Cursor pos tracking (in canvas/logical coords)
    fabricCanvas.on('mouse:move', (opt) => {
      const p = fabricCanvas.getPointer(opt.e);
      setCursor({ x: p.x, y: p.y });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track space-hold for temporary pan
  useEffect(() => {
    const isTyping = () =>
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isTyping()) {
        if (!spaceHeldRef.current) {
          spaceHeldRef.current = true;
          prevToolRef.current = activeTool;
          setSpacePan(true);
          e.preventDefault();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spaceHeldRef.current) {
        spaceHeldRef.current = false;
        setSpacePan(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTool]);

  // Handle tool changes — configure interactivity
  useEffect(() => {
    if (!canvas) return;
    canvas.isDrawingMode = false;

    const panActive = activeTool === 'pan' || spacePan;

    if (panActive) {
      canvas.defaultCursor = 'grab';
      canvas.hoverCursor = 'grab';
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else if (activeTool === 'pen') {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        if (obj.isTemp) return;
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    }

    canvas.requestRenderAll();
  }, [activeTool, spacePan, canvas]);

  // Pan mouse handlers (bound only when pan is active)
  useEffect(() => {
    if (!canvas) return;
    const panActive = activeTool === 'pan' || spacePan;
    if (!panActive) return;

    const onDown = (opt: any) => {
      isPanningRef.current = true;
      panLastRef.current = { x: opt.e.clientX, y: opt.e.clientY };
      canvas.setCursor('grabbing');
    };
    const onMove = (opt: any) => {
      if (!isPanningRef.current || !panLastRef.current) return;
      const dx = opt.e.clientX - panLastRef.current.x;
      const dy = opt.e.clientY - panLastRef.current.y;
      panLastRef.current = { x: opt.e.clientX, y: opt.e.clientY };
      const vpt = canvas.viewportTransform;
      if (!vpt) return;
      vpt[4] += dx;
      vpt[5] += dy;
      canvas.setViewportTransform(vpt);
      canvas.requestRenderAll();
    };
    const onUp = () => {
      isPanningRef.current = false;
      panLastRef.current = null;
      canvas.setCursor('grab');
    };

    canvas.on('mouse:down', onDown);
    canvas.on('mouse:move', onMove);
    canvas.on('mouse:up', onUp);
    return () => {
      canvas.off('mouse:down', onDown);
      canvas.off('mouse:move', onMove);
      canvas.off('mouse:up', onUp);
    };
  }, [canvas, activeTool, spacePan]);

  // Pen events
  useEffect(() => {
    if (!canvas) return;
    const penActive = activeTool === 'pen' || penTool.isEditMode;
    if (!penActive) return;

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
      if (penTool.isEditMode) penTool.exitEditMode();
      if (penTool.isDrawing) penTool.cancelDrawing();
      if (pointEditor.isEditing) pointEditor.exit(true);
      setActiveTool('select');
    },
    h: () => setActiveTool('pan'),
    a: () => {
      const activeObj = canvas?.getActiveObject();
      if (!canvas || !activeObj || pointEditor.isEditing) return;
      pointEditor.enter(activeObj);
    },
    r: () => {
      if (!canvas) return;
      const rect = makeRect({ fill: defaultFill, stroke: defaultStroke });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      setActiveTool('select');
    },
    c: () => {
      if (!canvas) return;
      const circle = makeCircle({ fill: defaultFill, stroke: defaultStroke });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      setActiveTool('select');
    },
    t: () => {
      if (!canvas) return;
      const text = makeText({ fill: defaultFill, stroke: defaultStroke });
      canvas.add(text);
      canvas.setActiveObject(text);
      setActiveTool('select');
    },
    p: () => {
      if (penTool.isEditMode) penTool.exitEditMode();
      setActiveTool('pen');
    },
    'shift+c': () => {
      if (pointEditor.isEditing && pointEditor.selectedAnchorIndex !== null) {
        const current = pointEditor.getAnchors()[pointEditor.selectedAnchorIndex];
        const newType = current.type === 'smooth' ? 'corner' : 'smooth';
        pointEditor.convertPointType(pointEditor.selectedAnchorIndex, newType);
      }
    },
    enter: () => {
      if (pointEditor.isEditing) pointEditor.exit(true);
    },
    escape: () => {
      if (penTool.isEditMode) {
        penTool.exitEditMode();
        setActiveTool('select');
      } else if (penTool.isDrawing) {
        penTool.cancelDrawing();
        setActiveTool('select');
      } else if (pointEditor.isEditing) {
        pointEditor.exit(false);
      }
    },
    delete: () => deleteSelection(),
    backspace: () => deleteSelection(),
    'ctrl+z': () => history.undo(),
    'ctrl+shift+z': () => history.redo(),
    'ctrl+y': () => history.redo(),
    'ctrl+=': () => {
      if (!canvas) return;
      const z = Math.min(20, canvas.getZoom() * 1.1);
      canvas.setZoom(z);
      setZoom(z);
    },
    'ctrl+-': () => {
      if (!canvas) return;
      const z = Math.max(0.02, canvas.getZoom() * 0.9);
      canvas.setZoom(z);
      setZoom(z);
    },
    'ctrl+0': () => {
      if (!canvas) return;
      canvas.setZoom(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      setZoom(1);
    },
    'ctrl+d': () => duplicateSelection(),
    'ctrl+a': () => {
      if (!canvas) return;
      const objs = canvas.getObjects().filter((o: any) => !o.isTemp && o.selectable !== false);
      if (objs.length === 0) return;
      canvas.discardActiveObject();
      const sel = new ActiveSelection(objs, { canvas });
      canvas.setActiveObject(sel);
      canvas.requestRenderAll();
    },
  });

  const deleteSelection = () => {
    if (!canvas) return;
    if (pointEditor.isEditing && pointEditor.selectedAnchorIndex !== null) {
      pointEditor.removePoint(pointEditor.selectedAnchorIndex);
      return;
    }
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.requestRenderAll();
    }
  };

  const duplicateSelection = async () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const cloned = await active.clone();
    cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
  };

  const showEditGuide = useMemo(() => {
    return (
      selectedObject instanceof Path &&
      !penTool.isDrawing &&
      !penTool.isEditMode &&
      !pointEditor.isEditing &&
      activeTool === 'select'
    );
  }, [selectedObject, penTool.isDrawing, penTool.isEditMode, pointEditor.isEditing, activeTool]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} />
      {showEditGuide && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.72)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 6,
            fontSize: 13,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
            userSelect: 'none',
          }}
        >
          Double-click or press <b>A</b> to edit points
        </div>
      )}
    </div>
  );
};

export default CanvasArea;
