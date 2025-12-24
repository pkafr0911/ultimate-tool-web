import React, { useEffect, useRef } from 'react';
import { Canvas, Image, PencilBrush, IText } from 'fabric';
import { usePhotoEditor } from '../context';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  } = usePhotoEditor();

  const isEditingRef = useRef(false);

  useKeyboardShortcuts(canvas);

  const altPressedRef = useRef(false);
  const previewDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canvas || !addOnFile) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      Image.fromURL(data).then((img) => {
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

  // Alt+hover preview and Alt+click to pick brush color when activeTool === 'brush'
  useEffect(() => {
    if (!canvas || !containerRef.current) return;

    const container = containerRef.current;
    const lower = (canvas.lowerCanvasEl as HTMLCanvasElement) || null;

    // create preview div
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
    container.appendChild(preview);
    previewDivRef.current = preview;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altPressedRef.current = true;
        if (activeTool === 'brush') {
          // disable drawing while picking
          canvas.isDrawingMode = false;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        altPressedRef.current = false;
        if (activeTool === 'brush') {
          canvas.isDrawingMode = true;
        }
        if (previewDivRef.current) previewDivRef.current.style.display = 'none';
      }
    };

    const onMouseMove = (opt: any) => {
      if (!altPressedRef.current || activeTool !== 'brush') return;
      try {
        const evt = opt && opt.e;
        const pointer = canvas.getPointer(evt);
        if (!lower) return;
        const ctx = lower.getContext('2d');
        if (!ctx) return;
        const x = Math.floor(pointer.x);
        const y = Math.floor(pointer.y);
        if (x < 0 || y < 0 || x >= lower.width || y >= lower.height) {
          if (previewDivRef.current) previewDivRef.current.style.display = 'none';
          return;
        }
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex =
          '#' + [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
        if (previewDivRef.current) {
          previewDivRef.current.style.background = hex;
          previewDivRef.current.style.display = 'block';
          // position using client coords
          const rect = container.getBoundingClientRect();
          const clientX = evt.clientX || rect.left + pointer.x;
          const clientY = evt.clientY || rect.top + pointer.y;
          previewDivRef.current.style.left = clientX - rect.left + 24 + 'px';
          previewDivRef.current.style.top = clientY - rect.top + 24 + 'px';
        }
      } catch (err) {
        if (previewDivRef.current) previewDivRef.current.style.display = 'none';
      }
    };

    const onMouseDown = (opt: any) => {
      if (!altPressedRef.current || activeTool !== 'brush') return;
      try {
        const evt = opt && opt.e;
        const pointer = canvas.getPointer(evt);
        if (!lower) return;
        const ctx = lower.getContext('2d');
        if (!ctx) return;
        const x = Math.floor(pointer.x);
        const y = Math.floor(pointer.y);
        if (x < 0 || y < 0 || x >= lower.width || y >= lower.height) return;
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex =
          '#' + [pixel[0], pixel[1], pixel[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
        if (canvas.freeDrawingBrush) {
          (canvas.freeDrawingBrush as any).color = hex;
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:down', onMouseDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:down', onMouseDown);
      if (previewDivRef.current) {
        try {
          container.removeChild(previewDivRef.current);
        } catch (e) {
          // ignore
        }
        previewDivRef.current = null;
      }
    };
  }, [canvas, activeTool]);

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
      Image.fromURL(imageUrl).then((img) => {
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
    const onTextEnter = () => setActiveTool && setActiveTool('text');
    const onTextExit = () => setActiveTool && setActiveTool('select');

    fabricCanvas.on('text:editing:entered', onTextEnter);
    fabricCanvas.on('text:editing:exited', onTextExit);

    const saveHistory = () => {
      history.saveState();
    };

    fabricCanvas.on('object:modified', saveHistory);
    fabricCanvas.on('object:added', saveHistory);
    fabricCanvas.on('object:removed', saveHistory);

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
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = 'black';
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, canvas]);

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
