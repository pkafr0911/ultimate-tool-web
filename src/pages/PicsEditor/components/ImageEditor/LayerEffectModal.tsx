import React, { useEffect, useRef, useState } from 'react';
import { Modal, Slider, Space, Collapse, Button, Row, Col } from 'antd';
import { applyEffects } from '../../utils/helpers';

const { Panel } = Collapse;

type LayerEffectModalProps = {
  open: boolean;
  onCancel: () => void;
  onApply: (newImage: HTMLImageElement) => void;
  layer: any; // Using any for now to match existing types loosely
};

const LayerEffectModal: React.FC<LayerEffectModalProps> = ({ open, onCancel, onApply, layer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);

  // Effects State
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [blur, setBlur] = useState(0);
  const [gaussian, setGaussian] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [texture, setTexture] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [dehaze, setDehaze] = useState(0);
  const [bgThreshold, setBgThreshold] = useState(0);
  const [bgThresholdBlack, setBgThresholdBlack] = useState(0);

  // Initialize canvases
  useEffect(() => {
    if (!open || !layer?.img || !canvasRef.current || !baseCanvasRef.current) return;

    const canvas = canvasRef.current;
    const baseCanvas = baseCanvasRef.current;
    const img = layer.img;

    canvas.width = img.width;
    canvas.height = img.height;
    baseCanvas.width = img.width;
    baseCanvas.height = img.height;

    const ctx = canvas.getContext('2d')!;
    const baseCtx = baseCanvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);
    baseCtx.drawImage(img, 0, 0);

    // Reset all states
    setBrightness(0);
    setContrast(0);
    setBlur(0);
    setGaussian(0);
    setSharpen(0);
    setTexture(0);
    setClarity(0);
    setHighlights(0);
    setShadows(0);
    setWhites(0);
    setBlacks(0);
    setVibrance(0);
    setSaturation(0);
    setDehaze(0);
    setBgThreshold(0);
    setBgThresholdBlack(0);
  }, [open, layer]);

  // Apply effects when state changes
  useEffect(() => {
    if (!open || !canvasRef.current || !baseCanvasRef.current) return;

    // Debounce slightly to avoid too many updates?
    // applyEffects is synchronous but might be heavy.
    // For now, run directly.

    const dummyHistory = {
      push: () => {}, // No-op
    } as any;

    applyEffects(
      canvasRef,
      baseCanvasRef.current,
      {
        blur,
        gaussian,
        sharpen,
        texture,
        clarity,
        bgThreshold,
        bgThresholdBlack,
        brightness,
        contrast,
        highlights,
        shadows,
        whites,
        blacks,
        vibrance,
        saturation,
        dehaze,
        hslAdjustments: {}, // Not implementing HSL for now to save space/complexity
      },
      dummyHistory,
      () => {}, // dummy setHistogramData
    );
  }, [
    open,
    blur,
    gaussian,
    sharpen,
    texture,
    clarity,
    bgThreshold,
    bgThresholdBlack,
    brightness,
    contrast,
    highlights,
    shadows,
    whites,
    blacks,
    vibrance,
    saturation,
    dehaze,
  ]);

  const handleApply = () => {
    if (!canvasRef.current) return;
    const newImg = new Image();
    newImg.src = canvasRef.current.toDataURL();
    newImg.onload = () => {
      onApply(newImg);
    };
  };

  const SliderRow = ({ label, value, onChange, min = -100, max = 100 }: any) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Slider min={min} max={max} value={value} onChange={onChange} style={{ margin: '4px 0' }} />
    </div>
  );

  return (
    <Modal
      title="Layer Effects"
      open={open}
      onCancel={onCancel}
      onOk={handleApply}
      width={900}
      okText="Apply Effects"
      style={{ top: 20 }}
    >
      <div style={{ display: 'flex', gap: 24, height: '60vh' }}>
        {/* Controls */}
        <div style={{ width: 300, overflowY: 'auto', paddingRight: 8 }}>
          <Collapse defaultActiveKey={['1', '2']} ghost size="small">
            <Panel header="Light & Color" key="1">
              <SliderRow label="Brightness" value={brightness} onChange={setBrightness} />
              <SliderRow label="Contrast" value={contrast} onChange={setContrast} />
              <SliderRow label="Highlights" value={highlights} onChange={setHighlights} />
              <SliderRow label="Shadows" value={shadows} onChange={setShadows} />
              <SliderRow label="Whites" value={whites} onChange={setWhites} />
              <SliderRow label="Blacks" value={blacks} onChange={setBlacks} />
              <SliderRow label="Vibrance" value={vibrance} onChange={setVibrance} />
              <SliderRow label="Saturation" value={saturation} onChange={setSaturation} />
            </Panel>

            <Panel header="Detail & Effects" key="2">
              <SliderRow label="Texture" value={texture} onChange={setTexture} />
              <SliderRow label="Clarity" value={clarity} onChange={setClarity} />
              <SliderRow label="Dehaze" value={dehaze} onChange={setDehaze} />
              <SliderRow label="Sharpen" value={sharpen} onChange={setSharpen} min={0} max={5} />
              <SliderRow label="Blur" value={blur} onChange={setBlur} min={0} max={25} />
              <SliderRow
                label="Gaussian"
                value={gaussian}
                onChange={setGaussian}
                min={0}
                max={20}
              />
            </Panel>

            <Panel header="Remove Background" key="3">
              <SliderRow
                label="Remove White"
                value={bgThreshold}
                onChange={setBgThreshold}
                min={0}
                max={255}
              />
              <SliderRow
                label="Remove Black"
                value={bgThresholdBlack}
                onChange={setBgThresholdBlack}
                min={0}
                max={255}
              />
            </Panel>
          </Collapse>
        </div>

        {/* Preview */}
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ddd',
            borderRadius: 4,
            overflow: 'hidden',
            backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
          {/* Hidden base canvas for reference */}
          <canvas ref={baseCanvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </Modal>
  );
};

export default LayerEffectModal;
