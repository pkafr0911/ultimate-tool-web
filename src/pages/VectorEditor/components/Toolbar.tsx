import React from 'react';
import { Button, Tooltip, Space, Divider, Dropdown, message } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  FontSizeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UndoOutlined,
  RedoOutlined,
  EditOutlined,
  SettingOutlined,
  AimOutlined,
  LineOutlined,
  StarOutlined,
  CloudUploadOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { Path } from 'fabric';
import { useVectorEditor } from '../context';
import SettingsModal from './SettingsModal';
import ExportModal from './ExportModal';
import { SaveToDriveButton } from '@/components/GoogleDrive/DriveButtons';
import {
  makeRect,
  makeCircle,
  makeEllipse,
  makeTriangle,
  makeLine,
  makePolygon,
  makeStar,
  makeText,
} from '../utils/shapes';

const PolygonIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <polygon points="8,2 14,6 11.5,14 4.5,14 2,6" />
  </svg>
);

const EllipseIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <ellipse cx="8" cy="8" rx="7" ry="4.5" />
  </svg>
);

const TriangleIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <polygon points="8,2 14,14 2,14" />
  </svg>
);

const CircleIcon: React.FC = () => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="8" cy="8" r="6" />
  </svg>
);

const HandIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor">
    <path d="M8 1.5a1 1 0 0 1 1 1V7h.5V3a1 1 0 1 1 2 0v4.5h.5V4.5a1 1 0 1 1 2 0V10a4.5 4.5 0 1 1-9 0V6a1 1 0 1 1 2 0v1h.5V2.5a1 1 0 0 1 1-1z" />
  </svg>
);

const Toolbar: React.FC = () => {
  const {
    canvas,
    activeTool,
    setActiveTool,
    history,
    pointEditor,
    defaultFill,
    defaultStroke,
    setDefaultFill,
  } = useVectorEditor();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [polygonSides, setPolygonSides] = React.useState(6);
  const [starPoints, setStarPoints] = React.useState(5);

  const addAndSelect = (obj: any) => {
    if (!canvas) return;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setActiveTool('select');
  };

  const defaults = () => ({ fill: defaultFill, stroke: defaultStroke });

  const enterDirectSelection = () => {
    if (!canvas || !pointEditor) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      message.info('Select a path first');
      return;
    }
    if (!(activeObj instanceof Path)) {
      message.info('Point editing works on path objects only');
      return;
    }
    if (pointEditor.isEditing) {
      pointEditor.exit(true);
      setActiveTool('select');
    } else {
      pointEditor.enter(activeObj);
      setActiveTool('direct-select');
    }
  };

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    history.saveState();
  };

  const pickColor = async () => {
    const w = window as any;
    if (typeof w.EyeDropper !== 'function') {
      message.warning('Eyedropper is not supported in this browser');
      return;
    }
    try {
      const result = await new w.EyeDropper().open();
      if (result?.sRGBHex) {
        setDefaultFill(result.sRGBHex);
        message.success(`Picked ${result.sRGBHex}`);
      }
    } catch {
      /* user cancelled */
    }
  };

  const polygonMenu = {
    items: [3, 5, 6, 8, 10, 12].map((n) => ({
      key: `poly-${n}`,
      label: `${n}-sided polygon`,
      onClick: () => {
        setPolygonSides(n);
        addAndSelect(makePolygon(n, defaults()));
      },
    })),
  };

  const starMenu = {
    items: [3, 4, 5, 6, 8, 10].map((n) => ({
      key: `star-${n}`,
      label: `${n}-point star`,
      onClick: () => {
        setStarPoints(n);
        addAndSelect(makeStar(n, defaults()));
      },
    })),
  };

  return (
    <Space direction="vertical" size="small">
      <Tooltip title="Select (V)" placement="right">
        <Button
          type={activeTool === 'select' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('select')}
        />
      </Tooltip>

      <Tooltip title="Direct Select / Point Edit (A)" placement="right">
        <Button
          type={activeTool === 'direct-select' || pointEditor?.isEditing ? 'primary' : 'default'}
          icon={<AimOutlined />}
          onClick={enterDirectSelection}
        />
      </Tooltip>

      <Tooltip title="Pan (H / hold Space)" placement="right">
        <Button
          type={activeTool === 'pan' ? 'primary' : 'default'}
          icon={<HandIcon />}
          onClick={() => setActiveTool('pan')}
        />
      </Tooltip>

      <Divider style={{ margin: '4px 0' }} />

      <Tooltip title="Rectangle (R)" placement="right">
        <Button icon={<BorderOutlined />} onClick={() => addAndSelect(makeRect(defaults()))} />
      </Tooltip>

      <Tooltip title="Ellipse (E)" placement="right">
        <Button icon={<EllipseIcon />} onClick={() => addAndSelect(makeEllipse(defaults()))} />
      </Tooltip>

      <Tooltip title="Circle (C)" placement="right">
        <Button icon={<CircleIcon />} onClick={() => addAndSelect(makeCircle(defaults()))} />
      </Tooltip>

      <Tooltip title="Triangle" placement="right">
        <Button icon={<TriangleIcon />} onClick={() => addAndSelect(makeTriangle(defaults()))} />
      </Tooltip>

      <Tooltip title="Line (L)" placement="right">
        <Button icon={<LineOutlined />} onClick={() => addAndSelect(makeLine(defaults()))} />
      </Tooltip>

      <Dropdown menu={polygonMenu} placement="rightTop" trigger={['contextMenu']}>
        <Tooltip title="Polygon — right-click for sides" placement="right">
          <Button
            icon={<PolygonIcon />}
            onClick={() => addAndSelect(makePolygon(polygonSides, defaults()))}
          />
        </Tooltip>
      </Dropdown>

      <Dropdown menu={starMenu} placement="rightTop" trigger={['contextMenu']}>
        <Tooltip title="Star — right-click for points" placement="right">
          <Button
            icon={<StarOutlined />}
            onClick={() => addAndSelect(makeStar(starPoints, defaults()))}
          />
        </Tooltip>
      </Dropdown>

      <Tooltip title="Text (T)" placement="right">
        <Button icon={<FontSizeOutlined />} onClick={() => addAndSelect(makeText(defaults()))} />
      </Tooltip>

      <Tooltip title="Pen (P)" placement="right">
        <Button
          type={activeTool === 'pen' ? 'primary' : 'default'}
          icon={<EditOutlined />}
          onClick={() => setActiveTool('pen')}
        />
      </Tooltip>

      <Tooltip title="Eyedropper — set default fill (Chromium)" placement="right">
        <Button icon={<BgColorsOutlined />} onClick={pickColor} />
      </Tooltip>

      <Divider style={{ margin: '4px 0' }} />

      <Tooltip title="Undo (Ctrl+Z)" placement="right">
        <Button icon={<UndoOutlined />} onClick={history.undo} disabled={!history.canUndo} />
      </Tooltip>

      <Tooltip title="Redo (Ctrl+Shift+Z)" placement="right">
        <Button icon={<RedoOutlined />} onClick={history.redo} disabled={!history.canRedo} />
      </Tooltip>

      <Divider style={{ margin: '4px 0' }} />

      <Tooltip title="Clear canvas" placement="right">
        <Button icon={<DeleteOutlined />} danger onClick={clearCanvas} />
      </Tooltip>

      <Tooltip title="Export (SVG / PNG / JPEG)" placement="right">
        <Button icon={<DownloadOutlined />} onClick={() => setExportOpen(true)} />
      </Tooltip>

      <SaveToDriveButton
        getContent={() => (canvas ? canvas.toSVG() : '')}
        fileName="design.svg"
        mimeType="image/svg+xml"
        buttonProps={{
          icon: <CloudUploadOutlined />,
          style: { width: 32, height: 32, padding: 0 },
        }}
      >
        {null}
      </SaveToDriveButton>

      <Tooltip title="Canvas settings" placement="right">
        <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
      </Tooltip>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} canvas={canvas} />
    </Space>
  );
};

export default Toolbar;
