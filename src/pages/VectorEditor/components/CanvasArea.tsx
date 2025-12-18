import React, { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useVectorEditor } from '../context';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setSelectedObject } = useVectorEditor();

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Initialize fabric canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      selection: true,
    });

    setCanvas(fabricCanvas);

    // Event listeners
    fabricCanvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length === 1) {
        setSelectedObject(e.selected[0]);
      } else {
        setSelectedObject(null);
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.length === 1) {
        setSelectedObject(e.selected[0]);
      } else {
        setSelectedObject(null);
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current) {
        fabricCanvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Handle delete key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
          fabricCanvas.discardActiveObject();
          activeObjects.forEach((obj) => {
            fabricCanvas.remove(obj);
          });
          fabricCanvas.requestRenderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default CanvasArea;
