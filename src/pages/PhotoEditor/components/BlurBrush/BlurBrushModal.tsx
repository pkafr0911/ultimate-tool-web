import React, { useEffect, useRef, useState } from 'react';
import { Modal, Slider, Button, Space, Typography, Spin, Radio, Tooltip } from 'antd';
import { Canvas as FabricCanvas, FabricImage, PencilBrush } from 'fabric';
import { DeleteOutlined, UndoOutlined, EyeOutlined } from '@ant-design/icons';
import { loadOpenCv, applyBlurWithMask } from '../../utils/opencvHelpers';
import { applyBlurResultToCanvas } from '../../utils/effectsHelpers';
import { photoEditorMessages } from '../../hooks/useNotification';

const { Text } = Typography;

interface BlurBrushModalProps {
  visible: boolean;
  onCancel: () => void;
  canvas: FabricCanvas | null;
  history: any;
}

const BlurBrushModal: React.FC<BlurBrushModalProps> = ({ visible, onCancel, canvas, history }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null); // Ref for cursor overlay
  const [maskFabricCanvas, setMaskFabricCanvas] = useState<FabricCanvas | null>(null);

  const [brushSize, setBrushSize] = useState(30);
  const [blurAmount, setBlurAmount] = useState(15);
  const [feather, setFeather] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applyMode, setApplyMode] = useState<'overlay' | 'flatten'>('overlay');

  const blurAmountRef = useRef(blurAmount);
  const featherRef = useRef(feather);

  useEffect(() => {
    blurAmountRef.current = blurAmount;
  }, [blurAmount]);
  useEffect(() => {
    featherRef.current = feather;
  }, [feather]);

  // Initialize OpenCV on mount
  useEffect(() => {
    if (visible) {
      loadOpenCv().catch((err) => {
        photoEditorMessages.genericError('Failed to load OpenCV: ' + err.message);
      });
    }
  }, [visible]);

  // Setup canvases
  useEffect(() => {
    if (
      visible &&
      canvas &&
      maskCanvasRef.current &&
      previewCanvasRef.current &&
      containerRef.current
    ) {
      // 1. Setup Preview (Background) Canvas
      // For performance, we could use a static image of the current canvas state
      const width = canvas.getWidth();
      const height = canvas.getHeight();

      const previewCtx = previewCanvasRef.current.getContext('2d');
      if (previewCtx) {
        previewCanvasRef.current.width = width;
        previewCanvasRef.current.height = height;

        // Use toDataURL to capture the absolute canvas state (ignoring zoom/viewport)
        const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
        const img = new Image();
        img.onload = () => {
          previewCtx.drawImage(img, 0, 0, width, height);
        };
        img.src = dataURL;
      }

      // 2. Setup Mask Fabric Canvas
      // It sits on top of the preview
      if (maskFabricCanvas) {
        maskFabricCanvas.dispose();
      }

      const mCanvas = new FabricCanvas(maskCanvasRef.current, {
        isDrawingMode: true,
        width: width,
        height: height,
        backgroundColor: 'rgba(0,0,0,0)', // Transparent
        selection: false,
      });

      // Cursor Overlay Logic
      mCanvas.on('mouse:move', (opt) => {
        if (cursorRef.current) {
          const pointer = mCanvas.getScenePoint(opt.e);
          const size = mCanvas.freeDrawingBrush?.width || 30;
          cursorRef.current.style.display = 'block';
          cursorRef.current.style.transform = `translate(${pointer.x - size / 2}px, ${pointer.y - size / 2}px)`;
          cursorRef.current.style.width = `${size}px`;
          cursorRef.current.style.height = `${size}px`;
        }
      });

      mCanvas.on('mouse:out', () => {
        if (cursorRef.current) {
          cursorRef.current.style.display = 'none';
        }
      });

      // Configure Brush
      // We draw with white color which represents the mask
      // But visually we might want it semi-transparent red or something?
      // For logic: mask should be white on black.
      // For UX: user wants to see what they are painting (e.g., Red 50%).
      // We can paint with Red, then when extracting mask, we convert Red pixels to White.
      const brush = new PencilBrush(mCanvas);
      brush.color = 'rgba(255, 0, 0, 0.5)';
      brush.width = brushSize;
      mCanvas.freeDrawingBrush = brush;

      // Handle Instant Apply on Stroke End
      mCanvas.on('path:created', async (opt: any) => {
        try {
          setIsProcessing(true);
          const path = opt.path;

          // Generate Mask from valid mCanvas state (containing the new path)
          // Create temp canvas for mask processing
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = mCanvas.getWidth();
          tempCanvas.height = mCanvas.getHeight();
          const ctx = tempCanvas.getContext('2d')!;

          // Fill black
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          // Get data from fabric canvas
          const dataUrl = mCanvas.toDataURL({ format: 'png', multiplier: 1 });
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
          });

          ctx.drawImage(img, 0, 0);

          // Threshold to binary white
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            // Check Red channel
            if (data[i] > 20) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
              data[i + 3] = 255;
            } else {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
              data[i + 3] = 255;
            }
          }
          ctx.putImageData(imageData, 0, 0);

          // Apply Blur to PREVIEW canvas
          if (previewCanvasRef.current) {
            const result = await applyBlurWithMask(
              previewCanvasRef.current,
              tempCanvas,
              blurAmountRef.current,
              featherRef.current,
            );

            // Update preview with result
            const pCtx = previewCanvasRef.current.getContext('2d');
            if (pCtx) {
              pCtx.drawImage(result, 0, 0);
            }
          }

          // Clear the red stroke
          mCanvas.remove(path);
          mCanvas.requestRenderAll();
        } catch (e) {
          console.error('Auto blur failed', e);
        } finally {
          setIsProcessing(false);
        }
      });

      setMaskFabricCanvas(mCanvas);

      return () => {
        mCanvas.dispose();
      };
    }
  }, [visible, canvas]);

  // Update brush
  useEffect(() => {
    if (maskFabricCanvas) {
      maskFabricCanvas.freeDrawingBrush!.width = brushSize;
    }
  }, [brushSize, maskFabricCanvas]);

  const clearMask = () => {
    if (maskFabricCanvas) {
      maskFabricCanvas.clear();
      maskFabricCanvas.set('backgroundColor', 'rgba(0,0,0,0)');
      maskFabricCanvas.renderAll();
    }
  };

  const undoMask = () => {
    // Simple undo for fabric canvas (pop last object)
    if (maskFabricCanvas) {
      const objects = maskFabricCanvas.getObjects();
      if (objects.length > 0) {
        maskFabricCanvas.remove(objects[objects.length - 1]);
      }
    }
  };

  const getMaskImage = async (): Promise<HTMLCanvasElement> => {
    if (!maskFabricCanvas) throw new Error('No mask canvas');

    // We need a binary mask (white on black)
    // The user painted with rgba(255,0,0,0.5).
    // Export to dataURL/image then draw to temp canvas and threshold?
    // Or just iterate pixels?

    // Fabric toDataURL might include background transparency.
    // Let's create a temp canvas, fill black, draw the fabric mask objects in WHITE.

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maskFabricCanvas.getWidth();
    tempCanvas.height = maskFabricCanvas.getHeight();
    const ctx = tempCanvas.getContext('2d')!;

    // Fill black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // To draw objects in white:
    // We can iterate objects on maskFabricCanvas, clone them, set stroke to white, add to a static canvas?
    // Or simpler: use globalCompositeOperation if we export the current red mask.

    // Export the current mask as image (preserves transparency)
    const dataUrl = maskFabricCanvas.toDataURL({ format: 'png', multiplier: 1 });

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Draw the red tracks
        ctx.drawImage(img, 0, 0);

        // Now convert all non-black pixels to white?
        // Or better: Use 'source-in' composite?
        // Since we filled black, the transparent parts are black now (if we composed).
        // Wait, drawImage over black rect -> transparent parts remain black. Red parts become red on black.
        // We want Red -> White.

        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // If alpha > 0 or specific color?
          // The brush was red 0.5.
          // Check R channel.
          if (data[i] > 20) {
            // Threshold
            data[i] = 255; // R
            data[i + 1] = 255; // G
            data[i + 2] = 255; // B
            data[i + 3] = 255; // Alpha full
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255; // Full opaque black
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(tempCanvas);
      };
      img.src = dataUrl;
    });
  };

  const handlePreview = async () => {
    if (!canvas || !previewCanvasRef.current) return;
    setIsProcessing(true);
    try {
      const maskCanvas = await getMaskImage();
      const sourceCanvas = previewCanvasRef.current; // Currently holds original image

      // Perform Blur
      // For preview, we might want to downscale if large.
      // But let's try full res first or stick to plan (downscale).
      // Given structure, downscaling requires management of scaling factors.
      // Let's rely on simple full res for now, assuming average image < 4K.

      const result = await applyBlurWithMask(sourceCanvas, maskCanvas, blurAmount, feather);

      // Show result in preview canvas
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(result, 0, 0);
      }
      photoEditorMessages.filterApplied('Blur preview');
    } catch (e: any) {
      console.error(e);
      photoEditorMessages.filterFailed('Blur preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    if (!canvas || !previewCanvasRef.current) return;
    setIsProcessing(true);
    try {
      // Use the preview canvas as the result directly
      // Because we have been accumulating blurs on it

      history.saveState();
      await applyBlurResultToCanvas(canvas, previewCanvasRef.current, applyMode);
      history.saveState();

      photoEditorMessages.filterApplied('Blur');
      onCancel();
    } catch (e: any) {
      console.error(e);
      photoEditorMessages.filterFailed('Blur');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      title="Blur Brush"
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Canvas Area */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            border: '1px solid #d9d9d9',
            width: canvas?.getWidth() || 800,
            height: canvas?.getHeight() || 600,
            overflow: 'hidden',
          }}
        >
          {/* Background / Preview Layer */}
          <canvas ref={previewCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
          {/* Mask / Drawing Layer */}
          <canvas
            ref={maskCanvasRef}
            style={{ position: 'absolute', top: 0, left: 0, opacity: 1 }}
          />
          <div
            ref={cursorRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'none',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 0 4px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          />
        </div>

        {/* Right: Controls */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>Brush Size: {brushSize}px</Text>
            <Slider min={5} max={200} value={brushSize} onChange={setBrushSize} />
          </div>

          <div>
            <Text strong>Blur Amount: {blurAmount}</Text>
            <Slider min={1} max={100} value={blurAmount} onChange={setBlurAmount} />
          </div>

          <div>
            <Text strong>Feather: {feather}px</Text>
            <Slider min={0} max={50} value={feather} onChange={setFeather} />
          </div>

          <Space>
            <Tooltip title="Undo Mask Stroke">
              <Button icon={<UndoOutlined />} onClick={undoMask} />
            </Tooltip>
            <Tooltip title="Clear Mask">
              <Button icon={<DeleteOutlined />} onClick={clearMask} />
            </Tooltip>
          </Space>

          <Space direction="vertical" style={{ marginTop: 16 }}>
            <Text strong>Apply Mode:</Text>
            <Radio.Group value={applyMode} onChange={(e) => setApplyMode(e.target.value)}>
              <Radio value="overlay">Overlay (Non-destructive)</Radio>
              <Radio value="flatten">Flatten (Permanent)</Radio>
            </Radio.Group>
          </Space>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button icon={<EyeOutlined />} onClick={handlePreview} loading={isProcessing}>
              Update Preview
            </Button>
            <Space>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" onClick={handleApply} loading={isProcessing}>
                Apply Blur
              </Button>
            </Space>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, color: '#666' }}>
        Paint over areas to blur. Red overlay shows masked area. Click Preview to test settings.
      </div>
    </Modal>
  );
};

export default BlurBrushModal;
