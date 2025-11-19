import React from 'react';
import { Button, Divider, Slider, Space, Tooltip, message, ColorPicker, InputNumber } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  BgColorsOutlined,
  ScissorOutlined,
  ExportOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { applyEffects, copyToClipboard, flipH, flipV, rotate } from '../../utils/helpers';
import {
  applyBrightnessContrast,
  applyThresholdAlpha,
  cloneImageData,
} from '../../utils/ImageEditorEngine';
type HistoryItem = {
  url: string;
  label?: string;
};

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
};

const ImageEditorToolbar: React.FC<Props> = ({
  canvasRef,
  baseCanvas,
  history,
  drawColor,
  setDrawColor,
  drawLineWidth,
  setDrawLineWidth,
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
  setShowPerspectiveModal,
  dpiMeasured,
  setDpiMeasured,
  exportImage,
  onExport,
  overlayRef,
}) => {
  // Apply brightness/contrast to current canvas (mutates)
  const applyBrightnessContrastToCanvas = () => {
    if (!canvasRef.current || !baseCanvas) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const baseCtx = baseCanvas.getContext('2d')!;
    const baseImgData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    const cloned = cloneImageData(baseImgData);
    applyBrightnessContrast(cloned, brightness, contrast);
    ctx.putImageData(cloned, 0, 0);
    history.push(canvasRef.current.toDataURL(), 'Brightness/Contrast');
  };

  const applyThresholdBackground = (threshold = 240) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const id = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    applyThresholdAlpha(id, threshold);
    ctx.putImageData(id, 0, 0);
    history.push(canvasRef.current.toDataURL(), 'Background removed (threshold)');
  };

  return (
    <div style={{ width: 260 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
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
            <Button icon={<SwapOutlined rotate={90} />} onClick={() => flipV(canvasRef, history)} />
          </Tooltip>
        </Space>

        <Divider />

        {/* Brush */}
        <div>
          <div style={{ marginBottom: 8 }}>
            Brush Tool{' '}
            <Button size="small" onClick={() => setTool('draw')}>
              <EditOutlined />
            </Button>
          </div>
          <Space>
            <ColorPicker
              value={drawColor}
              onChange={(color) => setDrawColor(color.toHexString())}
              allowClear={false}
              showText
            />
            <InputNumber
              min={1}
              max={50}
              value={drawLineWidth}
              onChange={(v) => setDrawLineWidth(v || 1)}
              style={{ width: 60 }}
            />
          </Space>
        </div>

        <Divider />

        {/* Brightness / Contrast */}
        <div>
          <div style={{ marginBottom: 8 }}>Brightness</div>
          <Slider
            min={-150}
            max={150}
            value={brightness}
            onChange={setBrightness}
            onChangeComplete={applyBrightnessContrastToCanvas}
          />
          <div style={{ marginBottom: 8 }}>Contrast</div>
          <Slider
            min={-100}
            max={100}
            value={contrast}
            onChange={setContrast}
            onChangeComplete={applyBrightnessContrastToCanvas}
          />
        </div>

        <Divider />

        {/* Filters */}
        <div>
          <div style={{ marginBottom: 8 }}>Box Blur</div>
          <Slider
            min={0}
            max={25}
            value={blur}
            onChange={setBlur}
            onChangeComplete={(v) =>
              applyEffects(
                canvasRef,
                baseCanvas,
                {
                  blur,
                  gaussian,
                  sharpen,
                  bgThreshold,
                },
                history,
              )
            }
          />
          <div style={{ marginBottom: 8 }}>Gaussian Blur</div>
          <Slider
            min={0}
            max={20}
            value={gaussian}
            onChange={setGaussian}
            onChangeComplete={(v) =>
              applyEffects(
                canvasRef,
                baseCanvas,
                {
                  blur,
                  gaussian,
                  sharpen,
                  bgThreshold,
                },
                history,
              )
            }
          />
          <div style={{ marginBottom: 8 }}>Sharpen</div>
          <Slider
            min={0}
            max={5}
            value={sharpen}
            onChange={setSharpen}
            onChangeComplete={(v) =>
              applyEffects(
                canvasRef,
                baseCanvas,
                {
                  blur,
                  gaussian,
                  sharpen,
                  bgThreshold,
                },
                history,
              )
            }
          />
          <div style={{ marginBottom: 8 }}>Background Threshold</div>
          <Slider
            min={0}
            max={255}
            value={bgThreshold}
            onChange={setBgThreshold}
            onChangeComplete={(v) =>
              applyEffects(
                canvasRef,
                baseCanvas,
                {
                  blur,
                  gaussian,
                  sharpen,
                  bgThreshold,
                },
                history,
              )
            }
          />
        </div>

        <Divider />

        {/* Background */}
        <div>
          <div style={{ marginBottom: 8 }}>Background</div>
          <Space>
            <Button onClick={() => applyThresholdBackground(235)} icon={<BgColorsOutlined />}>
              Remove white
            </Button>
          </Space>
        </div>

        <Divider />

        {/* Crop / Perspective */}
        <div>
          <div style={{ marginBottom: 8 }}>Crop & Perspective</div>
          <Space>
            <Button icon={<ScissorOutlined />} onClick={() => setTool('crop')}>
              Crop (C)
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
        </div>

        <Divider />

        {/* Ruler */}
        <div>
          <div style={{ marginBottom: 8 }}>Ruler / DPI</div>
          <Space>
            <Button icon={'📏'} onClick={() => setTool('ruler')}>
              Ruler
            </Button>
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
        </div>

        <Divider />

        {/* Export */}
        <div>
          <div style={{ marginBottom: 8 }}>Export</div>
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
        </div>
      </Space>
    </div>
  );
};

export default ImageEditorToolbar;
