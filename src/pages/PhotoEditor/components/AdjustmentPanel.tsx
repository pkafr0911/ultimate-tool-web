import { CustomSlider, SLIDER_GRADIENTS } from './CustomSlider';
import React, { useEffect, useRef, useState } from 'react';
import { Typography, Space, Collapse } from 'antd';
import { isEditable } from '../utils/document';
import { usePhotoEditor } from '../context';
import { filters, FabricImage } from 'fabric';

const { Panel } = Collapse;

const FILTER_LIST = [
  { name: 'Grayscale', filter: filters.Grayscale, index: 9 },
  { name: 'Invert', filter: filters.Invert, index: 10 },
  { name: 'Sepia', filter: filters.Sepia, index: 11 },
  { name: 'Black&White', filter: filters.BlackWhite, index: 12 },
  { name: 'Brownie', filter: filters.Brownie, index: 13 },
  { name: 'Vintage', filter: filters.Vintage, index: 14 },
  { name: 'Kodachrome', filter: filters.Kodachrome, index: 15 },
  { name: 'Technicolor', filter: filters.Technicolor, index: 16 },
  { name: 'Polaroid', filter: filters.Polaroid, index: 17 },
];

const FilterPreview: React.FC<{
  name: string;
  filterClass: any;
  originalImage: HTMLImageElement | null;
  isActive: boolean;
  onClick: () => void;
}> = React.memo(({ name, filterClass, originalImage, isActive, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 60;
    canvas.width = size;
    canvas.height = size;

    // Create a temporary fabric image
    const fImg = new FabricImage(originalImage);

    const scale = size / Math.max(fImg.width || 1, fImg.height || 1);
    fImg.scale(scale);

    const filter = new filterClass();
    fImg.filters = [filter];
    fImg.applyFilters();

    const element = fImg.getElement();

    ctx.clearRect(0, 0, size, size);

    const dw = (fImg.width || 0) * (fImg.scaleX || 1);
    const dh = (fImg.height || 0) * (fImg.scaleY || 1);
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;

    ctx.drawImage(element, dx, dy, dw, dh);
  }, [originalImage, filterClass]);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Apply ${name} filter`}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          border: isActive ? '2px solid #1890ff' : '1px solid #f0f0f0',
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      <Typography.Text style={{ fontSize: 10, textAlign: 'center', lineHeight: 1.2 }}>
        {name}
      </Typography.Text>
    </div>
  );
});

FilterPreview.displayName = 'FilterPreview';

const AdjustmentPanel: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();
  const [, refresh] = useState(0);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (selectedObject && selectedObject.isType('image')) {
      const img = selectedObject as FabricImage;
      const src = img.getSrc();
      const image = new Image();
      image.crossOrigin = 'anonymous';
      let cancelled = false;
      image.onload = () => {
        if (!cancelled) setOriginalImage(image);
      };
      image.src = src;
      return () => {
        cancelled = true;
        image.onload = null;
      };
    }
    setOriginalImage(null);
    return undefined;
  }, [selectedObject]);

  const applyFilter = (index: number, filter: any) => {
    if (!isEditable(selectedObject) || !selectedObject?.isType('image')) return;
    const img = selectedObject as FabricImage;
    const type = [
      'Brightness',
      'Contrast',
      'Saturation',
      'Noise',
      'Pixelate',
      'Blur',
      'Gamma',
      'Vibrance',
      'HueRotation',
      ...FILTER_LIST.map((f) => f.filter.type),
    ][index];
    img.filters = img.filters.filter((f) => f && f.type !== type);
    if (filter) img.filters.push(filter);
    img.filters.sort((a, b) => filterOrder.indexOf(a.type) - filterOrder.indexOf(b.type));
    img.applyFilters();
    refresh((v) => v + 1);
    canvas?.requestRenderAll();
  };

  const handleBrightness = (value: number) => {
    const filter = new filters.Brightness({ brightness: value });
    applyFilter(0, filter);
  };

  const handleContrast = (value: number) => {
    const filter = new filters.Contrast({ contrast: value });
    applyFilter(1, filter);
  };

  const handleSaturation = (value: number) => {
    const filter = new filters.Saturation({ saturation: value });
    applyFilter(2, filter);
  };

  const handleNoise = (value: number) => {
    const filter = new filters.Noise({ noise: value });
    applyFilter(3, filter);
  };

  const handlePixelate = (value: number) => {
    const filter = value > 1 ? new filters.Pixelate({ blocksize: value }) : false;
    applyFilter(4, filter);
  };

  const handleBlur = (value: number) => {
    const filter = new filters.Blur({ blur: value });
    applyFilter(5, filter);
  };

  const handleGamma = (value: number) => {
    const filter = new filters.Gamma({ gamma: [value, value, value] });
    applyFilter(6, filter);
  };

  const handleVibrance = (value: number) => {
    const filter = new filters.Vibrance({ vibrance: value });
    applyFilter(7, filter);
  };

  const handleHueRotation = (value: number) => {
    const filter = new filters.HueRotation({ rotation: value });
    applyFilter(8, filter);
  };

  const handleToggleFilter = (index: number, FilterClass: any, checked: boolean) => {
    const filter = checked ? new FilterClass() : false;
    applyFilter(index, filter);
    history.saveState();
  };

  const filterOrder = [
    'Brightness',
    'Contrast',
    'Saturation',
    'Noise',
    'Pixelate',
    'Blur',
    'Gamma',
    'Vibrance',
    'HueRotation',
    ...FILTER_LIST.map((f) => f.filter.type),
  ];
  const valueOf = (type: string, key: string, fallback: number) => {
    const f = (selectedObject as FabricImage)?.filters?.find((f) => f?.type === type) as any;
    return f?.[key] ?? fallback;
  };
  if (!selectedObject || !selectedObject.isType('image')) {
    return <div style={{ padding: 10 }}>Select an image to adjust</div>;
  }

  return (
    <div style={{ padding: 10, height: '100%', overflowY: 'auto' }}>
      <Typography.Title level={5}>Adjustments</Typography.Title>
      <Collapse defaultActiveKey={['1', '2', '3']} ghost>
        <Panel header="Basic" key="1">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <CustomSlider
                label="Brightness"
                gradient={SLIDER_GRADIENTS.luminance}
                min={-1}
                max={1}
                step={0.01}
                value={valueOf('Brightness', 'brightness', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleBrightness}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Contrast"
                gradient={SLIDER_GRADIENTS.luminance}
                min={-1}
                max={1}
                step={0.01}
                value={valueOf('Contrast', 'contrast', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleContrast}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Saturation"
                gradient={SLIDER_GRADIENTS.saturation}
                min={-1}
                max={1}
                step={0.01}
                value={valueOf('Saturation', 'saturation', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleSaturation}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Vibrance"
                gradient={SLIDER_GRADIENTS.saturation}
                min={-1}
                max={1}
                step={0.01}
                value={valueOf('Vibrance', 'vibrance', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleVibrance}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Gamma"
                gradient={SLIDER_GRADIENTS.luminance}
                min={0.1}
                max={2.2}
                step={0.1}
                value={(valueOf('Gamma', 'gamma', 1) as any)?.[0] ?? 1}
                disabled={!isEditable(selectedObject)}
                onChange={handleGamma}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Hue Rotation"
                gradient={SLIDER_GRADIENTS.hue}
                min={-1}
                max={1}
                step={0.01}
                value={valueOf('HueRotation', 'rotation', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleHueRotation}
                onChangeComplete={() => history.saveState()}
              />
            </div>
          </Space>
        </Panel>

        <Panel header="Effects" key="2">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <CustomSlider
                label="Blur"
                min={0}
                max={1}
                step={0.01}
                value={valueOf('Blur', 'blur', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleBlur}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Noise"
                min={0}
                max={1000}
                value={valueOf('Noise', 'noise', 0)}
                disabled={!isEditable(selectedObject)}
                onChange={handleNoise}
                onChangeComplete={() => history.saveState()}
              />
            </div>
            <div>
              <CustomSlider
                label="Pixelate"
                min={1}
                max={20}
                value={valueOf('Pixelate', 'blocksize', 1)}
                disabled={!isEditable(selectedObject)}
                onChange={handlePixelate}
                onChangeComplete={() => history.saveState()}
              />
            </div>
          </Space>
        </Panel>

        <Panel header="Filters" key="3">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {FILTER_LIST.map((item) => {
              const isActive = !!(selectedObject as FabricImage).filters.find(
                (f) => f?.type === item.filter.type,
              );
              return (
                <FilterPreview
                  key={item.name}
                  name={item.name}
                  filterClass={item.filter}
                  originalImage={originalImage}
                  isActive={isActive}
                  onClick={() => handleToggleFilter(item.index, item.filter, !isActive)}
                />
              );
            })}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default AdjustmentPanel;
