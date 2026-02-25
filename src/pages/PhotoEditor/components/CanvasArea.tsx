import React, { useEffect, useRef } from 'react';
import { Canvas, FabricImage, PencilBrush, IText, Point } from 'fabric';
import { usePhotoEditor } from '../context';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSnappingGuides } from '../hooks/useSnappingGuides';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    canvas,
    setCanvas,
    selectedObject,
    setSelectedObject,
    history,
    imageUrl,
    initialProject,
    activeTool,
    addOnFile,
    setAddOnFile,
    setActiveTool,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
  } = usePhotoEditor();

  const isEditingRef = useRef(false);

  useKeyboardShortcuts(canvas);
  useSnappingGuides(canvas);

  const altPressedRef = useRef(false);
  const previewDivRef = useRef<HTMLDivElement | null>(null);
  const brushOverlayRef = useRef<HTMLDivElement | null>(null);
  const isResizingBrushRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartSizeRef = useRef(0);
  const brushSizeRef = useRef(brushSize);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    if (!canvas || !addOnFile) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      FabricImage.fromURL(data).then((img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.centerObject(img);
        canvas.setActiveObject(img);
        history.saveState();
        if (setAddOnFile) setAddOnFile(null);
      });
    };
    reader.readAsDataURL(addOnFile);
  }, [addOnFile, canvas]);

  // Sync brush settings
  useEffect(() => {
    if (canvas && canvas.freeDrawingBrush && activeTool === 'brush') {
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = brushColor;
    }
  }, [canvas, activeTool, brushSize, brushColor]);

  // Alt+hover preview, Alt+click to pick color, Alt+RightClick drag to resize
  useEffect(() => {
    if (!canvas || !containerRef.current) return;

    const container = containerRef.current;
    const lower = (canvas.lowerCanvasEl as HTMLCanvasElement) || null;

    // Create color preview div
    const preview = document.createElement('div');
    preview.style.position = 'absolute';
    preview.style.pointerEvents = 'none';
    preview.style.width = '28px';
    preview.style.height = '28px';
    preview.style.borderRadius = '50%';
    preview.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
    preview.style.border = '2px solid #fff';
    preview.style.transform = 'translate(-50%, -50%)';
    preview.style.display = 'none';
    preview.style.zIndex = '1000';
    container.appendChild(preview);
    previewDivRef.current = preview;

    // Create brush size overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.border = '1px solid rgba(0,0,0,0.5)';
    overlay.style.borderRadius = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.display = 'none';
    overlay.style.zIndex = '999';
    container.appendChild(overlay);
    brushOverlayRef.current = overlay;

    const updateCursorAndOverlay = (x: number, y: number, size: number) => {
      if (!brushOverlayRef.current) return;

      // Only show overlay if size is significantly larger than cursor or if we are resizing
      // Standard cursor is small. Let's say if size > 10 we show overlay.
      const showOverlay = activeTool === 'brush' && (size > 10 || isResizingBrushRef.current);

      if (showOverlay) {
        brushOverlayRef.current.style.width = `${size}px`;
        brushOverlayRef.current.style.height = `${size}px`;
        brushOverlayRef.current.style.left = `${x}px`;
        brushOverlayRef.current.style.top = `${y}px`;
        brushOverlayRef.current.style.display = 'block';

        // Hide default cursor when overlay is shown
        if (canvas.defaultCursor !== 'none') {
          canvas.defaultCursor = 'none';
          canvas.hoverCursor = 'none';
          canvas.requestRenderAll();
        }
      } else {
        brushOverlayRef.current.style.display = 'none';
        if (canvas.defaultCursor === 'none') {
          canvas.defaultCursor = 'default';
          canvas.hoverCursor = 'move';
          canvas.requestRenderAll();
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altPressedRef.current = true;
        if (activeTool === 'brush') {
          canvas.isDrawingMode = false;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altPressedRef.current = false;
        if (activeTool === 'brush' && !isResizingBrushRef.current) {
          canvas.isDrawingMode = true;
        }
        if (previewDivRef.current) previewDivRef.current.style.display = 'none';
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (e.altKey) {
        e.preventDefault();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (activeTool !== 'brush') return;

      // Alt + Right Click -> Resize
      if (e.altKey && e.button === 2) {
        e.preventDefault();
        isResizingBrushRef.current = true;
        resizeStartXRef.current = e.clientX;
        resizeStartSizeRef.current = brushSizeRef.current;
        canvas.isDrawingMode = false;
        return;
      }

      // Alt + Left Click -> Color Pick
      if (e.altKey && e.button === 0) {
        try {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          if (!lower) return;
          const ctx = lower.getContext('2d');
          if (!ctx) return;

          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex =
            '#' +
            [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');

          setBrushColor(hex);
        } catch (err) {
          // ignore
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (activeTool !== 'brush') {
        if (brushOverlayRef.current) brushOverlayRef.current.style.display = 'none';
        return;
      }

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Handle Resizing
      if (isResizingBrushRef.current) {
        const delta = e.clientX - resizeStartXRef.current;
        // Drag right -> increase, Drag left -> decrease
        // Sensitivity: 1px drag = 1px size change? Or maybe slower/faster?
        const newSize = Math.max(1, resizeStartSizeRef.current + delta);
        setBrushSize(newSize);
        updateCursorAndOverlay(x, y, newSize);
        return;
      }

      // Handle Overlay (Normal movement)
      updateCursorAndOverlay(x, y, brushSizeRef.current);

      // Handle Color Pick Preview
      if (altPressedRef.current) {
        try {
          if (!lower) return;
          const ctx = lower.getContext('2d');
          if (!ctx) return;

          // Check bounds
          if (x < 0 || y < 0 || x >= lower.width || y >= lower.height) {
            if (previewDivRef.current) previewDivRef.current.style.display = 'none';
            return;
          }

          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex =
            '#' +
            [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');

          if (previewDivRef.current) {
            previewDivRef.current.style.background = hex;
            previewDivRef.current.style.display = 'block';
            previewDivRef.current.style.left = x + 24 + 'px';
            previewDivRef.current.style.top = y + 24 + 'px';
          }
        } catch (err) {
          if (previewDivRef.current) previewDivRef.current.style.display = 'none';
        }
      } else {
        if (previewDivRef.current) previewDivRef.current.style.display = 'none';
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isResizingBrushRef.current) {
        isResizingBrushRef.current = false;
        if (activeTool === 'brush' && !altPressedRef.current) {
          canvas.isDrawingMode = true;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    container.addEventListener('contextmenu', onContextMenu);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (previewDivRef.current) {
        try {
          container.removeChild(previewDivRef.current);
        } catch (e) {}
        previewDivRef.current = null;
      }
      if (brushOverlayRef.current) {
        try {
          container.removeChild(brushOverlayRef.current);
        } catch (e) {}
        brushOverlayRef.current = null;
      }

      // Restore cursor
      if (canvas) {
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
      }
    };
  }, [canvas, activeTool, setBrushSize, setBrushColor]); // Removed brushSize from dependency to avoid re-bind

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true, // Important for layers
      selection: true,
    });

    setCanvas(fabricCanvas);

    if (initialProject) {
      fabricCanvas.loadFromJSON(initialProject.json).then(() => {
        fabricCanvas.renderAll();
        history.saveState();
      });
    } else if (imageUrl) {
      FabricImage.fromURL(imageUrl).then((img) => {
        const containerWidth = containerRef.current!.clientWidth;
        const containerHeight = containerRef.current!.clientHeight;

        if (img.width! > containerWidth || img.height! > containerHeight) {
          img.scaleToWidth(containerWidth * 0.8);
        }

        fabricCanvas.add(img);
        fabricCanvas.centerObject(img);
        fabricCanvas.setActiveObject(img);
        history.saveState();
      });
    }

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

    // When entering/exiting text editing, keep the active tool in 'text'
    const onTextEnter = () => {
      isEditingRef.current = true;
      setActiveTool && setActiveTool('text');
    };
    const onTextExit = () => setActiveTool && setActiveTool('select');

    fabricCanvas.on('text:editing:entered', onTextEnter);
    fabricCanvas.on('text:editing:exited', onTextExit);

    // Note: history event listeners (object:modified, object:added, object:removed)
    // are registered by useHistoryOptimized hook — no need to duplicate them here.

    // Ctrl + mouse wheel to zoom (centered at pointer)
    const onWheel = (ev: WheelEvent) => {
      // only when ctrlKey is pressed
      if (!ev.ctrlKey) return;
      ev.preventDefault();

      try {
        const currentZoom = fabricCanvas.getZoom() || 1;
        // wheel up -> zoom in, wheel down -> zoom out
        const delta = ev.deltaY;
        // Use an exponential zoom factor for smoother control
        const zoomFactor = delta < 0 ? 1.12 : 0.88;
        let newZoom = currentZoom * zoomFactor;
        newZoom = Math.max(0.1, Math.min(5, newZoom));

        // Get pointer in canvas coordinates
        // fabricCanvas.getPointer works with native events too
        const pointer = (fabricCanvas as any).getPointer(ev) as { x: number; y: number };
        if (pointer && typeof pointer.x === 'number' && typeof pointer.y === 'number') {
          fabricCanvas.zoomToPoint(new Point(pointer.x, pointer.y), newZoom);
        } else {
          // fallback: compute from client coords
          const rect = fabricCanvas.lowerCanvasEl.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          fabricCanvas.zoomToPoint(new Point(x, y), newZoom);
        }

        fabricCanvas.requestRenderAll();
      } catch (e) {
        // ignore
      }
    };

    // attach to container so we can prevent browser zoom
    containerRef.current.addEventListener('wheel', onWheel, { passive: false });

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
      if (containerRef.current) {
        try {
          containerRef.current.removeEventListener('wheel', onWheel as EventListener);
        } catch (e) {}
      }
    };
  }, []);

  // If selected object is a text object and is being edited, ensure the active tool is 'text'
  useEffect(() => {
    if (!selectedObject) return;
    try {
      const editing = !!(selectedObject as any).isEditing;
      isEditingRef.current = editing;
      if (editing) {
        setActiveTool && setActiveTool('text');
      }
    } catch (e) {
      // ignore
    }
  }, [selectedObject, setActiveTool]);

  useEffect(() => {
    if (!canvas) return;
    if (activeTool === 'brush') {
      canvas.isDrawingMode = true;
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = brushColor;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, canvas]); // brushSize and brushColor are handled by the sync effect

  // Place text on first mouse click when activeTool === 'text'
  useEffect(() => {
    if (!canvas) return;
    if (activeTool !== 'text') return;

    const handleMouseDown = (opt: any) => {
      try {
        // If a text object is currently being edited, do not create a new text object
        if (isEditingRef.current) return;

        const pointer = canvas.getViewportPoint(opt.e);
        const txt = new IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 24,
        });
        canvas.add(txt);
        canvas.setActiveObject(txt);
        setSelectedObject && setSelectedObject(txt);
        txt.enterEditing && txt.enterEditing();
        txt.selectAll && txt.selectAll();
        canvas.requestRenderAll();
        history.saveState();
        // switch back to select so subsequent clicks don't add more text
        setActiveTool && setActiveTool('select');
      } catch (err) {
        // ignore
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    return () => {
      canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, activeTool, history, setSelectedObject, setActiveTool]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default CanvasArea;
