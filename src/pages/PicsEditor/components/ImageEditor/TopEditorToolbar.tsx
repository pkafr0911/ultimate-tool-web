import React, { useRef } from 'react';
import { Button, Space, Tooltip, Select, InputNumber, ColorPicker } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  MergeCellsOutlined,
  UpOutlined,
  DownOutlined,
  DeleteOutlined,
  ItalicOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  FontColorsOutlined,
  HighlightOutlined,
} from '@ant-design/icons';
import { HistoryController } from '../../hooks/useHistory';
import { Tool } from './types';

const { Option } = Select;

type TopEditorToolbarProps = {
  history: HistoryController;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  tool: Tool;
  setTool: (v: Tool) => void;
  brushType: 'hard' | 'soft';
  setBrushType: (v: 'hard' | 'soft') => void;
  drawColor: string;
  setDrawColor: (v: string) => void;
  drawLineWidth: number;
  setDrawLineWidth: (v: number) => void;
  brushOpacity: number;
  setBrushOpacity: (v: number) => void;
  brushFlow: number;
  setBrushFlow: (v: number) => void;
  // layer controls (optional)
  layers?: Array<{
    id: string;
    type?: 'image' | 'text';
    img?: HTMLImageElement;
    rect?: { x: number; y: number; w: number; h: number };
    opacity: number;
    blend?: GlobalCompositeOperation;
    text?: string;
    font?: string;
    fontSize?: number;
    fontWeight?: any;
    fontItalic?: boolean;
    textDecoration?: 'none' | 'underline' | 'line-through';
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right';
  }>;
  activeLayerId?: string | null;
  setLayerOpacity?: (id: string, v: number) => void;
  setLayerBlend?: (id: string, v: GlobalCompositeOperation) => void;
  // full layer actions
  moveLayerUp?: (id: string) => void;
  moveLayerDown?: (id: string) => void;
  deleteLayer?: (id: string) => void;
  selectLayer?: (id: string) => void;
  mergeLayer?: (id?: string) => void;
  // text tool controls
  textContent?: string;
  setTextContent?: (v: string) => void;
  textFont?: string;
  setTextFont?: (v: string) => void;
  textFontSize?: number;
  setTextFontSize?: (v: number) => void;
  textColor?: string;
  setTextColor?: (v: string) => void;
  textWeight?: 'normal' | 'bold' | 'lighter' | string;
  setTextWeight?: (v: any) => void;
  textItalic?: boolean;
  setTextItalic?: (v: boolean) => void;
  textDecoration?: 'none' | 'underline' | 'line-through';
  setTextDecoration?: (v: 'none' | 'underline' | 'line-through') => void;
  textAlign?: 'left' | 'center' | 'right';
  setTextAlign?: (v: 'left' | 'center' | 'right') => void;
  onAddTextLayer?: () => void;
  isAddingText?: boolean;
  setIsAddingText?: (v: boolean) => void;
  // mask tool controls
  onOpenMaskTool?: (layerId: string) => void;
  onOpenLayerEffects?: (layerId: string) => void;
};

const TopEditorToolbar: React.FC<TopEditorToolbarProps> = ({
  history,
  setZoom,
  tool,
  setTool,
  brushType,
  setBrushType,
  drawColor,
  setDrawColor,
  drawLineWidth,
  setDrawLineWidth,
  brushOpacity,
  setBrushOpacity,
  brushFlow,
  setBrushFlow,
  layers,
  activeLayerId,
  setLayerOpacity,
  setLayerBlend,
  moveLayerUp,
  moveLayerDown,
  deleteLayer,
  selectLayer,
  mergeLayer,
  textContent,
  setTextContent,
  textFont,
  setTextFont,
  textFontSize,
  setTextFontSize,
  textColor,
  setTextColor,
  textWeight,
  setTextWeight,
  textItalic,
  setTextItalic,
  textDecoration,
  setTextDecoration,
  textAlign,
  setTextAlign,
  onAddTextLayer,
  isAddingText,
  setIsAddingText,
  onOpenMaskTool,
  onOpenLayerEffects,
}) => {
  // Drag-to-adjust opacity refs
  const draggingOpacity = useRef(false);
  const opacityDragStartX = useRef<number | null>(null);
  const opacityStartValue = useRef<number>(brushOpacity);
  // Drag-to-adjust flow refs
  const draggingFlow = useRef(false);
  const flowDragStartX = useRef<number | null>(null);
  const flowStartValue = useRef<number>(brushFlow);

  const handleOpacityLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    draggingOpacity.current = true;
    opacityDragStartX.current = e.clientX;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    // === TRANSFORMERS ===
    const getStartValue = () => {
      if (tool === 'draw') return brushOpacity;
      if (tool === 'layer' && layers) {
        const active = layers.find((l) => l.id === activeLayerId);
        return active?.opacity ?? brushOpacity;
      }
      return brushOpacity;
    };

    const applyValue = (value: number) => {
      const val = Number(value.toFixed(2));
      if (tool === 'draw') {
        setBrushOpacity(val);
        return;
      }

      if (tool === 'layer' && layers) {
        const active = layers.find((l) => l.id === activeLayerId);
        if (active && setLayerOpacity) setLayerOpacity(active.id, val);
      }
    };

    opacityStartValue.current = getStartValue();

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingOpacity.current || opacityDragStartX.current === null) return;
      const delta = ev.clientX - opacityDragStartX.current;
      const sensitivity = 0.005;
      const newVal = Math.min(1, Math.max(0, opacityStartValue.current + delta * sensitivity));
      applyValue(newVal);
    };

    const onMouseUp = () => {
      draggingOpacity.current = false;
      opacityDragStartX.current = null;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleFlowLabelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left button
    e.preventDefault();
    draggingFlow.current = true;
    flowDragStartX.current = e.clientX;
    flowStartValue.current = brushFlow;

    // prevent text selection while dragging
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingFlow.current || flowDragStartX.current === null) return;
      const delta = ev.clientX - flowDragStartX.current;
      // sensitivity: 0.005 per pixel = 0.05 change per 10px
      const sensitivity = 0.005;
      let newVal = flowStartValue.current + delta * sensitivity;
      newVal = Math.max(0, Math.min(1, newVal));
      setBrushFlow(Number(newVal.toFixed(2)));
    };

    const onMouseUp = () => {
      draggingFlow.current = false;
      flowDragStartX.current = null;
      flowStartValue.current = brushFlow;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        {/* History selector */}
        <Select
          style={{ width: 150 }}
          placeholder="History"
          value={history.index}
          onChange={(idx) => history.applyHistory(idx)}
          optionLabelProp="label"
        >
          {history.history.map((item, idx) => (
            <Select.Option key={idx} value={idx} label={item.label || `Step ${idx + 1}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={item.url}
                  alt=""
                  style={{
                    width: 40,
                    height: 30,
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                  }}
                />
                <span>{item.label || `Step ${idx + 1}`}</span>
              </div>
            </Select.Option>
          ))}
        </Select>

        {/* Zoom controls */}
        <Tooltip title="Zoom In">
          <Button icon={<ZoomInOutlined />} onClick={() => setZoom((z) => Math.min(z * 1.2, 8))} />
        </Tooltip>
        <Tooltip title="Zoom Out">
          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => setZoom((z) => Math.max(z / 1.2, 0.1))}
          />
        </Tooltip>

        {/* Tool selector */}
        <Select value={tool} onChange={(v) => setTool(v as Tool)} style={{ width: 140 }}>
          <Option value="pan">Pan</Option>
          <Option value="move">Move</Option>
          <Option value="color">Color Picker</Option>
          <Option value="crop">Crop</Option>
          <Option value="ruler">Ruler</Option>
          <Option value="perspective">Perspective</Option>
          <Option value="draw">Brush</Option>
          <Option value="text">Text</Option>
        </Select>

        <Space style={{ width: '100%' }} wrap>
          {tool === 'color' ? (
            <ColorPicker value={drawColor} onChange={(c) => setDrawColor(c.toHexString())} />
          ) : null}
          {tool === 'draw' ? (
            <>
              {/* Brush Type */}
              <Select
                value={brushType}
                onChange={(v) => setBrushType(v as 'hard' | 'soft')}
                style={{ width: 80 }}
              >
                <Option value="hard">Hard</Option>
                <Option value="soft">Soft</Option>
              </Select>

              {/* Color Picker */}
              <ColorPicker value={drawColor} onChange={(c) => setDrawColor(c.toHexString())} />

              {/* Brush Size */}
              <InputNumber
                style={{ width: 100 }}
                min={1}
                max={500}
                value={drawLineWidth}
                onChange={(v) => setDrawLineWidth(v || 1)}
                addonAfter="px"
              />

              {/* Opacity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  onMouseDown={handleOpacityLabelMouseDown}
                  style={{ cursor: 'ew-resize', userSelect: 'none' }}
                  title="Drag left/right to change opacity"
                >
                  Opacity:
                </span>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ width: 60 }}
                  value={brushOpacity}
                  onChange={(v) => setBrushOpacity(v || 0)}
                />
              </div>

              {/* Flow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  onMouseDown={handleFlowLabelMouseDown}
                  style={{ cursor: 'ew-resize', userSelect: 'none' }}
                  title="Drag left/right to change flow"
                >
                  Flow:
                </span>
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ width: 60 }}
                  value={brushFlow}
                  onChange={(v) => setBrushFlow(v || 0)}
                />
              </div>
            </>
          ) : null}

          {tool === 'text' ? (
            <>
              {/* Text tool controls */}
              {/* Text placement and editing handled on-canvas; toolbar shows controls only */}

              <Select
                value={textFont || 'Arial'}
                onChange={(v) => setTextFont && setTextFont(v)}
                style={{ width: 100 }}
              >
                <Option value="Arial">Arial</Option>
                <Option value="Helvetica">Helvetica</Option>
                <Option value="Times New Roman">Times New Roman</Option>
                <Option value="Courier New">Courier New</Option>
                <Option value="Georgia">Georgia</Option>
                <Option value="Verdana">Verdana</Option>
              </Select>

              <InputNumber
                min={8}
                max={200}
                value={textFontSize || 32}
                onChange={(v) => setTextFontSize && setTextFontSize(v || 32)}
                addonAfter="px"
                style={{ width: 90 }}
              />

              <ColorPicker
                value={textColor || '#000000'}
                onChange={(c) => setTextColor && setTextColor(c.toHexString())}
              />

              <Select
                value={textWeight || 'normal'}
                onChange={(v) => setTextWeight && setTextWeight(v)}
                style={{ width: 80 }}
              >
                <Option value="lighter">Lighter</Option>
                <Option value="normal">Normal</Option>
                <Option value="bold">Bold</Option>
                <Option value="900">900</Option>
              </Select>

              <Tooltip title="Italic">
                <Button
                  size="small"
                  icon={<ItalicOutlined />}
                  type={textItalic ? 'primary' : 'default'}
                  onClick={() => setTextItalic && setTextItalic(!textItalic)}
                />
              </Tooltip>

              <Select
                value={textDecoration || 'none'}
                onChange={(v) => setTextDecoration && setTextDecoration(v as any)}
                style={{ width: 100 }}
              >
                <Option value="none">No decoration</Option>
                <Option value="underline">Underline</Option>
                <Option value="line-through">Strike</Option>
              </Select>

              <Tooltip title="Align">
                <Space size="small">
                  <Button
                    size="small"
                    icon={<AlignLeftOutlined />}
                    type={textAlign === 'left' ? 'primary' : 'default'}
                    onClick={() => setTextAlign && setTextAlign('left')}
                  />
                  <Button
                    size="small"
                    icon={<AlignCenterOutlined />}
                    type={textAlign === 'center' ? 'primary' : 'default'}
                    onClick={() => setTextAlign && setTextAlign('center')}
                  />
                  <Button
                    size="small"
                    icon={<AlignRightOutlined />}
                    type={textAlign === 'right' ? 'primary' : 'default'}
                    onClick={() => setTextAlign && setTextAlign('right')}
                  />
                </Space>
              </Tooltip>

              {/* add button removed — placement via canvas click */}
            </>
          ) : null}

          {tool === 'layer' ? (
            <>
              {/* Layer controls (select + actions + opacity/blend for active) */}
              {layers && layers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Layers</span>
                    <Select
                      value={activeLayerId || undefined}
                      placeholder="Select layer"
                      onChange={(v) => selectLayer && selectLayer(v as string)}
                      style={{ width: 180 }}
                      showSearch
                    >
                      {layers
                        .slice()
                        .reverse()
                        .map((L) => (
                          <Option key={L.id} value={L.id} label={`Layer ${L.id}`}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {L.img && (
                                <img
                                  src={L.img?.src}
                                  alt=""
                                  style={{ width: 40, height: 28, objectFit: 'cover' }}
                                />
                              )}
                              {L.text && <FontColorsOutlined />}
                              <span style={{ fontSize: 12 }}>{L.id}</span>
                            </div>
                          </Option>
                        ))}
                    </Select>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      size="small"
                      icon={<MergeCellsOutlined />}
                      onClick={() => mergeLayer && mergeLayer()}
                    >
                      Merge All
                    </Button>
                  </div>

                  {/* per-active-layer actions */}
                  {activeLayerId &&
                    (() => {
                      const active = layers.find((l) => l.id === activeLayerId);
                      if (!active) return null;
                      return (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Button
                            size="small"
                            icon={<MergeCellsOutlined />}
                            onClick={() => mergeLayer && mergeLayer(active.id)}
                          >
                            Merge
                          </Button>
                          <Button
                            size="small"
                            icon={<HighlightOutlined />}
                            onClick={() => onOpenMaskTool && onOpenMaskTool(active.id)}
                          >
                            Mask
                          </Button>
                          <Button
                            size="small"
                            icon={<FontColorsOutlined />}
                            onClick={() => onOpenLayerEffects && onOpenLayerEffects(active.id)}
                          >
                            Effects
                          </Button>
                          <Button
                            size="small"
                            icon={<UpOutlined />}
                            onClick={() => moveLayerUp && moveLayerUp(active.id)}
                          />
                          <Button
                            size="small"
                            icon={<DownOutlined />}
                            onClick={() => moveLayerDown && moveLayerDown(active.id)}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteLayer && deleteLayer(active.id)}
                          />

                          {/* opacity & blend controls */}
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}
                          >
                            <span
                              onMouseDown={handleOpacityLabelMouseDown}
                              style={{ cursor: 'ew-resize', userSelect: 'none' }}
                              title="Drag left/right to change opacity"
                            >
                              Opacity:
                            </span>
                            <InputNumber
                              min={0}
                              max={1}
                              step={0.01}
                              style={{ width: 80 }}
                              value={Number(active.opacity.toFixed(2))}
                              onChange={(v) =>
                                setLayerOpacity && setLayerOpacity(active.id, Number(v || 0))
                              }
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ userSelect: 'none' }}>Blend:</span>
                            <Select
                              value={active.blend || 'source-over'}
                              onChange={(v) =>
                                setLayerBlend &&
                                setLayerBlend(active.id, v as GlobalCompositeOperation)
                              }
                              style={{ width: 140 }}
                            >
                              <Option value="source-over">Normal</Option>
                              <Option value="multiply">Multiply</Option>
                              <Option value="screen">Screen</Option>
                              <Option value="overlay">Overlay</Option>
                              <Option value="lighter">Lighten</Option>
                              <Option value="darken">Darken</Option>
                            </Select>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              )}
            </>
          ) : null}
        </Space>
      </Space>
    </div>
  );
};

export default TopEditorToolbar;
