import React from 'react';
import { Button, Space, Tooltip, Typography, Divider } from 'antd';
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  GroupOutlined,
  UngroupOutlined,
  VerticalLeftOutlined,
  VerticalRightOutlined,
  UpSquareOutlined,
  DownSquareOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useVectorEditor } from '../context';
import { ActiveSelection } from 'fabric';

const { Title } = Typography;

type AlignDir = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
type DistributeDir = 'horizontal' | 'vertical';

const AlignmentPanel: React.FC = () => {
  const { canvas, selectedObject, history } = useVectorEditor();

  if (!selectedObject) return null;

  const activeObjs = () => canvas?.getActiveObjects() ?? [];

  const align = (dir: AlignDir) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    const objs = active instanceof ActiveSelection ? active.getObjects() : [active];

    // Align to canvas when single object, to selection bounds when multiple
    if (objs.length <= 1) {
      const target = objs[0] || active;
      const cw = canvas.width || 0;
      const ch = canvas.height || 0;
      const br = target.getBoundingRect();
      switch (dir) {
        case 'left':
          target.set({ left: (target.left || 0) - br.left });
          break;
        case 'center':
          canvas.centerObjectH(target);
          break;
        case 'right':
          target.set({ left: (target.left || 0) + (cw - (br.left + br.width)) });
          break;
        case 'top':
          target.set({ top: (target.top || 0) - br.top });
          break;
        case 'middle':
          canvas.centerObjectV(target);
          break;
        case 'bottom':
          target.set({ top: (target.top || 0) + (ch - (br.top + br.height)) });
          break;
      }
      target.setCoords();
    } else {
      // Align each object to the selection's bounding box
      const rects = objs.map((o) => o.getBoundingRect());
      const minX = Math.min(...rects.map((r) => r.left));
      const maxX = Math.max(...rects.map((r) => r.left + r.width));
      const minY = Math.min(...rects.map((r) => r.top));
      const maxY = Math.max(...rects.map((r) => r.top + r.height));
      objs.forEach((o, i) => {
        const r = rects[i];
        switch (dir) {
          case 'left':
            o.set({ left: (o.left || 0) - (r.left - minX) });
            break;
          case 'center':
            o.set({ left: (o.left || 0) + (minX + (maxX - minX) / 2 - (r.left + r.width / 2)) });
            break;
          case 'right':
            o.set({ left: (o.left || 0) + (maxX - (r.left + r.width)) });
            break;
          case 'top':
            o.set({ top: (o.top || 0) - (r.top - minY) });
            break;
          case 'middle':
            o.set({ top: (o.top || 0) + (minY + (maxY - minY) / 2 - (r.top + r.height / 2)) });
            break;
          case 'bottom':
            o.set({ top: (o.top || 0) + (maxY - (r.top + r.height)) });
            break;
        }
        o.setCoords();
      });
    }
    canvas.requestRenderAll();
    history.saveState();
  };

  const distribute = (dir: DistributeDir) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!(active instanceof ActiveSelection)) return;
    const objs = active.getObjects();
    if (objs.length < 3) return;

    const rects = objs.map((o) => ({ obj: o, r: o.getBoundingRect() }));

    if (dir === 'horizontal') {
      rects.sort((a, b) => a.r.left - b.r.left);
      const total =
        rects[rects.length - 1].r.left + rects[rects.length - 1].r.width - rects[0].r.left;
      const usedBy = rects.reduce((sum, x) => sum + x.r.width, 0);
      const gap = (total - usedBy) / (rects.length - 1);
      let cursor = rects[0].r.left;
      rects.forEach(({ obj, r }) => {
        obj.set({ left: (obj.left || 0) + (cursor - r.left) });
        obj.setCoords();
        cursor += r.width + gap;
      });
    } else {
      rects.sort((a, b) => a.r.top - b.r.top);
      const total =
        rects[rects.length - 1].r.top + rects[rects.length - 1].r.height - rects[0].r.top;
      const usedBy = rects.reduce((sum, x) => sum + x.r.height, 0);
      const gap = (total - usedBy) / (rects.length - 1);
      let cursor = rects[0].r.top;
      rects.forEach(({ obj, r }) => {
        obj.set({ top: (obj.top || 0) + (cursor - r.top) });
        obj.setCoords();
        cursor += r.height + gap;
      });
    }

    canvas.requestRenderAll();
    history.saveState();
  };

  const stack = (op: 'front' | 'back' | 'forward' | 'backward') => {
    if (!canvas) return;
    const objs = activeObjs();
    objs.forEach((o) => {
      if (op === 'front') canvas.bringObjectToFront(o);
      else if (op === 'back') canvas.sendObjectToBack(o);
      else if (op === 'forward') canvas.bringObjectForward(o);
      else canvas.sendObjectBackwards(o);
    });
    canvas.requestRenderAll();
    history.saveState();
  };

  const groupObjects = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    (active as any).toGroup();
    canvas.requestRenderAll();
    history.saveState();
  };

  const ungroupObjects = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'group') return;
    (active as any).toActiveSelection();
    canvas.requestRenderAll();
    history.saveState();
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Title level={5}>Align & arrange</Title>
      <Space wrap size={4}>
        <Tooltip title="Align left">
          <Button size="small" icon={<AlignLeftOutlined />} onClick={() => align('left')} />
        </Tooltip>
        <Tooltip title="Align center">
          <Button size="small" icon={<AlignCenterOutlined />} onClick={() => align('center')} />
        </Tooltip>
        <Tooltip title="Align right">
          <Button size="small" icon={<AlignRightOutlined />} onClick={() => align('right')} />
        </Tooltip>
        <Tooltip title="Align top">
          <Button size="small" icon={<VerticalAlignTopOutlined />} onClick={() => align('top')} />
        </Tooltip>
        <Tooltip title="Align middle">
          <Button
            size="small"
            icon={<VerticalAlignMiddleOutlined />}
            onClick={() => align('middle')}
          />
        </Tooltip>
        <Tooltip title="Align bottom">
          <Button
            size="small"
            icon={<VerticalAlignBottomOutlined />}
            onClick={() => align('bottom')}
          />
        </Tooltip>
      </Space>

      <div style={{ marginTop: 8 }}>
        <Space size={4}>
          <Tooltip title="Distribute horizontally (3+ selected)">
            <Button
              size="small"
              icon={<VerticalLeftOutlined rotate={90} />}
              onClick={() => distribute('horizontal')}
            />
          </Tooltip>
          <Tooltip title="Distribute vertically (3+ selected)">
            <Button
              size="small"
              icon={<VerticalRightOutlined rotate={90} />}
              onClick={() => distribute('vertical')}
            />
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title="Group">
            <Button size="small" icon={<GroupOutlined />} onClick={groupObjects} />
          </Tooltip>
          <Tooltip title="Ungroup">
            <Button size="small" icon={<UngroupOutlined />} onClick={ungroupObjects} />
          </Tooltip>
        </Space>
      </div>

      <div style={{ marginTop: 8 }}>
        <Space size={4}>
          <Tooltip title="Bring to front">
            <Button size="small" icon={<UpSquareOutlined />} onClick={() => stack('front')} />
          </Tooltip>
          <Tooltip title="Bring forward">
            <Button size="small" icon={<UpOutlined />} onClick={() => stack('forward')} />
          </Tooltip>
          <Tooltip title="Send backward">
            <Button size="small" icon={<DownOutlined />} onClick={() => stack('backward')} />
          </Tooltip>
          <Tooltip title="Send to back">
            <Button size="small" icon={<DownSquareOutlined />} onClick={() => stack('back')} />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};

export default AlignmentPanel;
