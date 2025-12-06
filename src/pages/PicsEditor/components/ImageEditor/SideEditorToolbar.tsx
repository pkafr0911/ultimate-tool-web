import React, { useEffect, useState } from 'react';
import { Button, Space, Tooltip, message, Collapse } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ScissorOutlined,
  ExportOutlined,
  CopyOutlined,
  EditOutlined,
  DragOutlined,
  FontColorsOutlined,
  BorderInnerOutlined,
  SignatureOutlined,
  RetweetOutlined,
  BgColorsOutlined,
  SaveOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import ImageTracer from 'imagetracerjs';
import {
  applyEffects,
  copyToClipboard,
  extractRGBHistogram,
  flipH,
  flipV,
  rotate,
  applyInvertColors,
} from '../../utils/helpers';
import { CustomSlider } from './CustomSlider';
import { HistoryController } from '../../hooks/useHistory';
import RGBHistogram from './RGBHistogram';
import UpscaleModal from './UpscaleModal';
import ExportModal from './ExportModal';
import { Tool } from './types';

const { Panel } = Collapse;

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  baseCanvas?: HTMLCanvasElement | null;
  history: HistoryController;
  setTool: (value: React.SetStateAction<Tool>) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  contrast: number;
  setContrast: (v: number) => void;
  blur: number;
  setBlur: (v: number) => void;
  gaussian: number;
  setGaussian: (v: number) => void;
  sharpen: number;
  setSharpen: (v: number) => void;
  bgThreshold: number;
  setBgThreshold: (v: number) => void;
  bgThresholdBlack: number;
  setBgThresholdBlack: (v: number) => void;
  setShowPerspectiveModal: (show: boolean) => void;
  dpiMeasured?: number | null;
  setDpiMeasured?: (v: number | null) => void;
  exportImage: (
    jpg: boolean,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    callback?: (blob: Blob) => void,
    includeOverlays?: boolean,
  ) => void;
  onExport?: (blob: Blob) => void;
  overlayRef: React.RefObject<HTMLCanvasElement>;
  texture: number;
  setTexture: (v: number) => void;
  clarity: number;
  setClarity: (v: number) => void;
  highlights: number;
  setHighlights: (v: number) => void;
  shadows: number;
  setShadows: (v: number) => void;
  whites: number;
  setWhites: (v: number) => void;
  blacks: number;
  setBlacks: (v: number) => void;
  vibrance: number;
  setVibrance: (v: number) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  dehaze: number;
  setDehaze: (v: number) => void;
  hslAdjustments: Record<string, { h?: number; s?: number; l?: number }>;
  setHslAdjustments: (name: string, values: Partial<{ h: number; s: number; l: number }>) => void;
  upscaleImage?: (
    factor: number,
    preset?: 'low' | 'medium' | 'high',
    qualityOptions?: { sharpen?: number; edgeEnhancement?: number; denoise?: number },
  ) => void;
  onColorRemovalToolClick?: () => void;
  showExportModal: boolean;
  setShowExportModal: (v: boolean) => void;
  onSave?: () => void;
};

const SideEditorToolbar: React.FC<Props> = ({
  canvasRef,
  baseCanvas,
  history,

  setTool,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  blur,
  setBlur,
  gaussian,
  setGaussian,
  sharpen,
  setSharpen,
  bgThreshold,
  setBgThreshold,
  bgThresholdBlack,
  setBgThresholdBlack,
  setShowPerspectiveModal,
  dpiMeasured,
  setDpiMeasured,
  exportImage,
  onExport,
  overlayRef,
  texture,
  setTexture,
  clarity,
  setClarity,
  highlights,
  setHighlights,
  shadows,
  setShadows,
  whites,
  setWhites,
  blacks,
  setBlacks,
  vibrance,
  setVibrance,
  saturation,
  setSaturation,
  dehaze,
  setDehaze,
  hslAdjustments,
  setHslAdjustments,
  upscaleImage,
  onColorRemovalToolClick,
  showExportModal,
  setShowExportModal,
  onSave,
}) => {
  const [activeColor, setActiveColor] = useState('red');
  const [showUpscaleModal, setShowUpscaleModal] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2);
  const [presetLocal, setPresetLocal] = useState<'low' | 'medium' | 'high'>('medium');
  const [sharpenAmount, setSharpenAmount] = useState<number>(0);
  const [edgeEnhancement, setEdgeEnhancement] = useState<number>(0);
  const [denoiseAmount, setDenoiseAmount] = useState<number>(0);

  // SVG conversion states
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const [ltres, setLtres] = useState(1);
  const [qtres, setQtres] = useState(1);
  const [pathomit, setPathomit] = useState(8);
  const [colorsampling, setColorsampling] = useState(2);
  const [strokewidth, setStrokewidth] = useState(1);
  const [histogramData, setHistogramData] = useState<{
    red: number[];
    green: number[];
    blue: number[];
  }>({
    red: [],
    green: [],
    blue: [],
  });

  useEffect(() => {
    if (canvasRef.current) {
      const extracted = extractRGBHistogram(canvasRef.current);
      setHistogramData(extracted);
    }
  }, [canvasRef.current]);

  const colorSwatches = [
    { name: 'red', color: '#ff4d4d' },
    { name: 'orange', color: '#ffa500' },
    { name: 'yellow', color: '#ffd700' },
    { name: 'green', color: '#00c853' },
    { name: 'aqua', color: '#00e5ff' },
    { name: 'blue', color: '#2979ff' },
    { name: 'purple', color: '#9c27b0' },
    { name: 'magenta', color: '#ff00aa' },
  ];

  const getSliderGradient = (activeColor: string, type: 'h' | 's' | 'l') => {
    const base = colorSwatches.find((c) => c.name === activeColor)?.color || '#ffffff';

    const index = colorSwatches.findIndex((c) => c.name === activeColor);

    // If not found, default to grayscale
    if (index === -1) return '#555';

    const current = colorSwatches[index].color;
    const left = colorSwatches[index - 1]?.color || current; // If first, use itself
    const right = colorSwatches[index + 1]?.color || current; // If last, use itself

    switch (type) {
      case 'h':
        return `linear-gradient(90deg, ${left}, ${current}, ${right})`;
      case 's':
        return `linear-gradient(90deg, gray, ${base})`;
      case 'l':
        return `linear-gradient(90deg, black, ${base}, white)`;
      default:
        return '#555';
    }
  };

  const toneSliders = [
    { key: 'texture', label: 'Texture', value: texture, setter: setTexture },
    { key: 'clarity', label: 'Clarity', value: clarity, setter: setClarity },
    { key: 'highlights', label: 'Highlights', value: highlights, setter: setHighlights },
    { key: 'shadows', label: 'Shadows', value: shadows, setter: setShadows },
    { key: 'whites', label: 'Whites', value: whites, setter: setWhites },
    { key: 'blacks', label: 'Blacks', value: blacks, setter: setBlacks },
  ];

  const effectSliders = [
    { key: 'blur', label: 'Box Blur', min: 0, max: 25, value: blur, setter: setBlur },
    { key: 'gaussian', label: 'Gaussian', min: 0, max: 20, value: gaussian, setter: setGaussian },
    { key: 'sharpen', label: 'Sharpen', min: 0, max: 5, value: sharpen, setter: setSharpen },
    {
      key: 'bgThreshold',
      label: 'Remove White',
      min: 0,
      max: 255,
      value: bgThreshold,
      setter: setBgThreshold,
    },
    {
      key: 'bgThresholdBlack',
      label: 'Remove Black',
      min: 0,
      max: 255,
      value: bgThresholdBlack,
      setter: setBgThresholdBlack,
    },
  ];

  const apply = () =>
    applyEffects(
      canvasRef,
      baseCanvas,
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
        hslAdjustments,
      },
      history,
      setHistogramData,
    );

  const handleCustomUpscale = () => {
    setTool('upscale');
    const qualityOptions = {
      sharpen: sharpenAmount,
      edgeEnhancement: edgeEnhancement,
      denoise: denoiseAmount,
    };
    upscaleImage?.(upscaleFactor, presetLocal, qualityOptions);
    setShowUpscaleModal(false);
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportImage = (format: 'png' | 'jpg', includeOverlays: boolean) => {
    exportImage(format === 'jpg', canvasRef, onExport, includeOverlays);
  };

  const handleConvertToSvg = () => {
    if (!canvasRef.current) {
      message.error('No image to convert');
      return;
    }

    setProcessing(true);
    const dataUrl = canvasRef.current.toDataURL();

    try {
      ImageTracer.imageToSVG(
        dataUrl,
        (svgString) => {
          setSvgContent(svgString);
          setProcessing(false);
          message.success('Image converted to SVG successfully!');
        },
        { scale, ltres, qtres, pathomit, colorsampling, strokewidth },
      );
    } catch (err: any) {
      console.error(err);
      setProcessing(false);
      message.error('Error converting image to SVG.');
    }
  };

  const getSvgModalWidth = () => {
    if (!canvasRef.current) return 700;
    const canvasWidth = canvasRef.current.width;
    const minWidth = 500;
    const maxWidth = window.innerWidth * 0.9;
    return Math.min(Math.max(canvasWidth + 100, minWidth), maxWidth);
  };

  const getSvgModalHeight = () => {
    if (!canvasRef.current) return undefined;
    const canvasHeight = canvasRef.current.height;
    const maxHeight = window.innerHeight * 0.85;
    return Math.min(canvasHeight + 300, maxHeight);
  };

  const handleDownloadSvg = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div style={{ width: 260 }}>
      <Collapse
        defaultActiveKey={['histogram', 'basic', 'lights', 'effects']}
        ghost
        expandIconPosition="end"
      >
        <Panel header="Histogram" key="histogram">
          <RGBHistogram
            canvasRef={canvasRef}
            redData={histogramData.red}
            greenData={histogramData.green}
            blueData={histogramData.blue}
          />
        </Panel>

        {/* 🔧 Basic Tools */}
        <Panel header="🛠 Basic" key="basic">
          <Space wrap>
            <Tooltip title="Undo (Ctrl+Z)">
              <Button icon={<UndoOutlined />} onClick={history.undo} />
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <Button icon={<RedoOutlined />} onClick={history.redo} />
            </Tooltip>
            <Tooltip title="Rotate left">
              <Button
                icon={<RotateLeftOutlined />}
                onClick={() => rotate(-90, canvasRef, overlayRef, history)}
              />
            </Tooltip>
            <Tooltip title="Rotate right (R)">
              <Button
                icon={<RotateRightOutlined />}
                onClick={() => rotate(90, canvasRef, overlayRef, history)}
              />
            </Tooltip>
            <Tooltip title="Flip horizontal">
              <Button icon={<SwapOutlined />} onClick={() => flipH(canvasRef, history)} />
            </Tooltip>
            <Tooltip title="Flip vertical">
              <Button
                icon={<SwapOutlined rotate={90} />}
                onClick={() => flipV(canvasRef, history)}
              />
            </Tooltip>

            <Tooltip title="Crop (C)">
              <Button icon={<ScissorOutlined />} onClick={() => setTool('crop')} />
            </Tooltip>
            <Tooltip title="Perspective">
              <Button
                icon={<BorderInnerOutlined />}
                onClick={() => {
                  setShowPerspectiveModal(true);
                  setTool('perspective');
                }}
              />
            </Tooltip>
            <Tooltip title="Brush (B)">
              <Button icon={<SignatureOutlined />} onClick={() => setTool('draw')} />
            </Tooltip>
            <Tooltip title="Text (T)">
              <Button icon={<FontColorsOutlined />} onClick={() => setTool('text')} />
            </Tooltip>
            <Tooltip title="Layer (V)">
              <Button icon={<DragOutlined />} onClick={() => setTool('layer')} />
            </Tooltip>
            <Tooltip title="Invert Colors (Ctrl+I)">
              <Button
                icon={<RetweetOutlined />}
                onClick={() => applyInvertColors(canvasRef, history)}
              />
            </Tooltip>
            <Tooltip title="Remove color">
              <Button icon={<BgColorsOutlined />} onClick={onColorRemovalToolClick} />
            </Tooltip>
          </Space>
        </Panel>

        {/* 🔆 Light */}
        <Panel header="🔆 Light" key="lights">
          <CustomSlider
            key={'brightness'}
            label={'Brightness'}
            value={brightness}
            min={-150}
            max={150}
            onChange={setBrightness}
            onChangeComplete={apply}
          />
          <CustomSlider
            key={'contrast'}
            label={'Contrast'}
            value={contrast}
            min={-100}
            max={100}
            onChange={setContrast}
            onChangeComplete={apply}
          />
        </Panel>

        {/* 🎨 Color & HSL */}
        <Panel header="🎨 Color" key="color">
          <CustomSlider
            key={'vibrance'}
            label={'Vibrance'}
            value={vibrance}
            min={-100}
            max={100}
            onChange={setVibrance}
            onChangeComplete={apply}
          />

          <CustomSlider
            key={'saturation'}
            label={'Saturation'}
            value={saturation}
            min={-100}
            max={100}
            onChange={setSaturation}
            onChangeComplete={apply}
          />

          <CustomSlider
            key={'dehaze'}
            label={'Dehaze'}
            value={dehaze}
            min={-100}
            max={100}
            onChange={setDehaze}
            onChangeComplete={apply}
          />

          {/* HSL Picker */}
          <div style={{ marginTop: 10 }}>HSL Mixer</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {colorSwatches.map(({ name, color }) => (
              <Tooltip title={name.toUpperCase()}>
                <div
                  key={name}
                  onClick={() => setActiveColor(name)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: color,
                    border: activeColor === name ? '2px solid white' : '1px solid #555',
                    boxShadow: activeColor === name ? '0 0 6px rgba(255,255,255,0.8)' : '',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            ))}
          </div>
          {/* <div>{activeColor.toUpperCase()}</div> */}

          {['Hue', 'Saturation', 'Luminance'].map((label) => {
            const key = label[0].toLowerCase(); // h/s/l
            return (
              <CustomSlider
                key={label}
                label={label}
                value={hslAdjustments[activeColor]?.[key] ?? 0}
                min={label === 'Hue' ? -180 : -100}
                max={label === 'Hue' ? 180 : 100}
                onChange={(v) => setHslAdjustments(activeColor, { [key]: v })}
                onChangeComplete={apply}
                gradient={getSliderGradient(activeColor, key as 'h' | 's' | 'l')}
              />
            );
          })}

          <Button size="small" onClick={() => setHslAdjustments(activeColor, { h: 0, s: 0, l: 0 })}>
            Reset
          </Button>
        </Panel>

        {/* ✨ Effects */}
        <Panel header="✨ Effects" key="effects">
          {toneSliders.map(({ key, label, value, setter }) => (
            <CustomSlider
              key={key}
              label={label}
              value={value}
              min={-100}
              max={100}
              onChange={setter}
              onChangeComplete={apply}
            />
          ))}
        </Panel>

        {/* 🎭 Filters */}
        <Panel header="🎭 Filters" key="filters">
          {effectSliders.map(({ key, label, min, max, value, setter }) => (
            <CustomSlider
              key={key}
              label={label}
              value={value}
              min={min}
              max={max}
              onChange={setter}
              onChangeComplete={apply}
            />
          ))}
        </Panel>

        {/* 📐 Crop / Ruler */}
        <Panel header="📐 Crop & Ruler" key="crop">
          <Space>
            <Button icon={<ScissorOutlined />} onClick={() => setTool('crop')}>
              Crop
            </Button>
            <Button
              onClick={() => {
                setShowPerspectiveModal(true);
                setTool('perspective');
              }}
            >
              Perspective
            </Button>
          </Space>

          <div style={{ marginTop: 10 }}>Ruler</div>
          <Space>
            <Button onClick={() => setTool('ruler')}>📏 Ruler</Button>
            <Button
              onClick={() => {
                setDpiMeasured?.(null);
                message.info('Ruler cleared');
              }}
            >
              Clear
            </Button>
          </Space>
          {dpiMeasured && <div>Estimated DPI: {dpiMeasured}</div>}
        </Panel>

        {/* Custom Upscale Modal launcher */}
        <Panel header="🔼 Upscale Options" key="upscaleOptions">
          <Button
            onClick={() => {
              setShowUpscaleModal(true);
            }}
          >
            Custom Upscale...
          </Button>
        </Panel>

        {/* 📤 Export */}
        <Panel header="📤 Export" key="export">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={onSave}
              block
              style={{ marginBottom: 8 }}
            >
              Save Project (Ctrl+S)
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExportClick} type="primary" block>
              Export Image / SVG
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(canvasRef)} block>
              Copy to Clipboard
            </Button>
          </Space>
        </Panel>
      </Collapse>

      <UpscaleModal
        open={showUpscaleModal}
        onCancel={() => setShowUpscaleModal(false)}
        onOk={handleCustomUpscale}
        upscaleFactor={upscaleFactor}
        setUpscaleFactor={setUpscaleFactor}
        presetLocal={presetLocal}
        setPresetLocal={setPresetLocal}
        sharpenAmount={sharpenAmount}
        setSharpenAmount={setSharpenAmount}
        edgeEnhancement={edgeEnhancement}
        setEdgeEnhancement={setEdgeEnhancement}
        denoiseAmount={denoiseAmount}
        setDenoiseAmount={setDenoiseAmount}
      />

      <ExportModal
        open={showExportModal}
        onCancel={() => {
          setShowExportModal(false);
          setSvgContent(null);
        }}
        onExportImage={handleExportImage}
        onExportSvg={handleConvertToSvg}
        canvasRef={canvasRef}
        processing={processing}
        svgContent={svgContent}
        scale={scale}
        setScale={setScale}
        ltres={ltres}
        setLtres={setLtres}
        qtres={qtres}
        setQtres={setQtres}
        pathomit={pathomit}
        setPathomit={setPathomit}
        colorsampling={colorsampling}
        setColorsampling={setColorsampling}
        strokewidth={strokewidth}
        setStrokewidth={setStrokewidth}
        onDownload={handleDownloadSvg}
        getSvgModalWidth={getSvgModalWidth}
        getSvgModalHeight={getSvgModalHeight}
      />
    </div>
  );
};

export default SideEditorToolbar;
