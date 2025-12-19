import React, { useEffect, useRef } from 'react';
import { Canvas, Image, PencilBrush } from 'fabric';
import { usePhotoEditor } from '../context';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    canvas,
    setCanvas,
    setSelectedObject,
    history,
    imageUrl,
    activeTool,
    addOnFile,
    setAddOnFile,
  } = usePhotoEditor();

  useKeyboardShortcuts(canvas);

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

    if (imageUrl) {
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

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default CanvasArea;
