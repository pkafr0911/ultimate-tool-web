import React from 'react';
import { Button, Space, Tooltip, Select, InputNumber, ColorPicker } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { HistoryController } from '../../hooks/useHistory';
import { Tool } from '.';

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
  handleOpacityLabelMouseDown: (e: React.MouseEvent) => void;
  handleFlowLabelMouseDown: (e: React.MouseEvent) => void;
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
  handleOpacityLabelMouseDown,
  handleFlowLabelMouseDown,
}) => (
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
        <Button icon={<ZoomOutOutlined />} onClick={() => setZoom((z) => Math.max(z / 1.2, 0.1))} />
      </Tooltip>

      {/* Tool selector */}
      <Select value={tool} onChange={(v) => setTool(v as Tool)} style={{ width: 140 }}>
        <Option value="pan">Pan</Option>
        <Option value="color">Color Picker</Option>
        <Option value="crop">Crop</Option>
        <Option value="ruler">Ruler</Option>
        <Option value="perspective">Perspective</Option>
        <Option value="draw">Brush</Option>
      </Select>

      <Space style={{ width: '100%' }} wrap>
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
      </Space>
    </Space>
  </div>
);

export default TopEditorToolbar;
