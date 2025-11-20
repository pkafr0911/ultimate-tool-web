import React, { useState } from 'react';
import {
  Button,
  Divider,
  Slider,
  Space,
  Tooltip,
  message,
  ColorPicker,
  InputNumber,
  Collapse,
  Select,
} from 'antd';
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
} from '@ant-design/icons';
import { applyEffects, copyToClipboard, flipH, flipV, rotate } from '../../utils/helpers';

const { Panel } = Collapse;

type HistoryItem = {
  url: string;
  label?: string;
};

const { Option } = Select;

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  baseCanvas?: HTMLCanvasElement | null;
  history: {
    history: HistoryItem[];
    index: number;
    current: HistoryItem;
    push: (url: string, label?: string) => void;
    undo: () => void;
    redo: () => void;
  };
  drawColor: string;
  setDrawColor: (color: string) => void;
  drawLineWidth: number;
  setDrawLineWidth: (width: number) => void;
  brushType: 'hard' | 'soft';
  setBrushType: (type: 'hard' | 'soft') => void;
  brushOpacity: number; // 0-1
  setBrushOpacity: (v: number) => void;
  brushFlow: number; // 0-1
  setBrushFlow: (v: number) => void;
  setTool: any;
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
};

const ImageEditorToolbar: React.FC<Props> = ({
  canvasRef,
  baseCanvas,
  history,
  drawColor,
  setDrawColor,
  drawLineWidth,
  setDrawLineWidth,
  brushType,
  setBrushType,
  brushOpacity,
  setBrushOpacity,
  brushFlow,
  setBrushFlow,
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
}) => {
  const [activeColor, setActiveColor] = useState('red');
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
    );

  return (
    <div style={{ width: 260 }}>
      <Collapse defaultActiveKey={['basic', 'lights', 'effects']} ghost expandIconPosition="end">
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
            <Tooltip title="Rotate right">
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
          </Space>
        </Panel>

        {/* 🖌 Brush */}
        <Panel header="🖊 Brush" key="brush">
          <Space direction="vertical" style={{ width: '100%' }} wrap>
            {/* Brush Type */}
            <Select
              value={brushType}
              onChange={(v) => setBrushType(v as 'hard' | 'soft')}
              style={{ width: 80 }}
            >
              <Option value="hard">Hard</Option>
              <Option value="soft">Soft</Option>
            </Select>
            <Space>
              {/* Color Picker */}
              <ColorPicker value={drawColor} onChange={(c) => setDrawColor(c.toHexString())} />

              {/* Brush Size */}
              <InputNumber
                min={1}
                max={50}
                value={drawLineWidth}
                onChange={(v) => setDrawLineWidth(v || 1)}
                addonAfter="px"
              />

              {/* Select Brush Tool */}
              <Button size="small" onClick={() => setTool('draw')}>
                <EditOutlined />
              </Button>
            </Space>

            <Space wrap>
              {/* Brush Opacity */}
              <div>
                <span>Opacity:</span>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ width: 60 }}
                  value={brushOpacity}
                  onChange={(v) => setBrushOpacity(v || 1)}
                />
              </div>

              {/* Brush Flow */}
              <div>
                <span>Flow:</span>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ width: 60 }}
                  value={brushFlow}
                  onChange={(v) => setBrushFlow(v || 1)}
                />
              </div>
            </Space>
          </Space>
        </Panel>

        {/* 🔆 Light */}
        <Panel header="🔆 Light" key="lights">
          <div>Brightness</div>
          <Slider
            min={-150}
            max={150}
            value={brightness}
            onChange={setBrightness}
            onChangeComplete={apply}
          />
          <div>Contrast</div>
          <Slider
            min={-100}
            max={100}
            value={contrast}
            onChange={setContrast}
            onChangeComplete={apply}
          />
        </Panel>

        {/* 🎨 Color & HSL */}
        <Panel header="🎨 Color" key="color">
          <div style={{ marginBottom: 8 }}>Vibrance</div>
          <Slider
            min={-100}
            max={100}
            value={vibrance}
            onChange={setVibrance}
            onChangeComplete={apply}
          />

          <div style={{ marginBottom: 8 }}>Saturation</div>
          <Slider
            min={-100}
            max={100}
            value={saturation}
            onChange={setSaturation}
            onChangeComplete={apply}
          />

          <div style={{ marginBottom: 8 }}>Dehaze</div>
          <Slider
            min={-100}
            max={100}
            value={dehaze}
            onChange={setDehaze}
            onChangeComplete={apply}
          />

          {/* HSL Picker */}
          <div style={{ marginTop: 10 }}>HSL Mixer</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {colorSwatches.map(({ name, color }) => (
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
            ))}
          </div>
          <div>{activeColor.toUpperCase()}</div>

          {['Hue', 'Saturation', 'Luminance'].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ width: 80 }}>{label}</span>
              <Slider
                min={label === 'Hue' ? -180 : -100}
                max={label === 'Hue' ? 180 : 100}
                value={hslAdjustments[activeColor]?.[label[0].toLowerCase()] ?? 0}
                onChange={(v) => setHslAdjustments(activeColor, { [label[0].toLowerCase()]: v })}
                onChangeComplete={apply}
                style={{ flex: 1 }}
              />
            </div>
          ))}

          <Button size="small" onClick={() => setHslAdjustments(activeColor, { h: 0, s: 0, l: 0 })}>
            Reset
          </Button>
        </Panel>

        {/* ✨ Effects */}
        <Panel header="✨ Effects" key="effects">
          <div>Texture</div>
          <Slider
            min={-100}
            max={100}
            value={texture}
            onChange={setTexture}
            onChangeComplete={apply}
          />
          <div>Clarity</div>
          <Slider
            min={-100}
            max={100}
            value={clarity}
            onChange={setClarity}
            onChangeComplete={apply}
          />

          <div>Highlights</div>
          <Slider
            min={-100}
            max={100}
            value={highlights}
            onChange={setHighlights}
            onChangeComplete={apply}
          />

          <div>Shadows</div>
          <Slider
            min={-100}
            max={100}
            value={shadows}
            onChange={setShadows}
            onChangeComplete={apply}
          />

          <div>Whites</div>
          <Slider
            min={-100}
            max={100}
            value={whites}
            onChange={setWhites}
            onChangeComplete={apply}
          />

          <div>Blacks</div>
          <Slider
            min={-100}
            max={100}
            value={blacks}
            onChange={setBlacks}
            onChangeComplete={apply}
          />
        </Panel>

        {/* 🎭 Filters */}
        <Panel header="🎭 Filters" key="filters">
          <div>Box Blur</div>
          <Slider min={0} max={25} value={blur} onChange={setBlur} onChangeComplete={apply} />
          <div>Gaussian</div>
          <Slider
            min={0}
            max={20}
            value={gaussian}
            onChange={setGaussian}
            onChangeComplete={apply}
          />
          <div>Sharpen</div>
          <Slider min={0} max={5} value={sharpen} onChange={setSharpen} onChangeComplete={apply} />

          <div>Remove White</div>
          <Slider
            min={0}
            max={255}
            value={bgThreshold}
            onChange={setBgThreshold}
            onChangeComplete={apply}
          />
          <div>Remove Black</div>
          <Slider
            min={0}
            max={255}
            value={bgThresholdBlack}
            onChange={setBgThresholdBlack}
            onChangeComplete={apply}
          />
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

        {/* 📤 Export */}
        <Panel header="📤 Export" key="export">
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={() => exportImage(false, canvasRef, onExport)}
            >
              PNG
            </Button>
            <Button onClick={() => exportImage(true, canvasRef, onExport)}>JPG</Button>
            <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(canvasRef)}>
              Copy
            </Button>
          </Space>
        </Panel>
      </Collapse>
    </div>
  );
};

export default ImageEditorToolbar;
