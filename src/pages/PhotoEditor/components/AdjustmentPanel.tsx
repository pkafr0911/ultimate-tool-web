import React, { useEffect, useRef, useState } from 'react';
import { Slider, Typography, Space, Collapse } from 'antd';
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
}> = ({ name, filterClass, originalImage, isActive, onClick }) => {
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
};

const AdjustmentPanel: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (selectedObject && selectedObject.isType('image')) {
      const img = selectedObject as FabricImage;
      const src = img.getSrc();
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = src;
      image.onload = () => {
        setOriginalImage(image);
      };
    } else {
      setOriginalImage(null);
    }
  }, [selectedObject]);

  const applyFilter = (index: number, filter: any) => {
    if (!selectedObject || !selectedObject.isType('image')) return;
    const img = selectedObject as any;
    img.filters[index] = filter;
    img.applyFilters();
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
              <Typography.Text>Brightness</Typography.Text>
              <Slider
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={handleBrightness}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Contrast</Typography.Text>
              <Slider
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={handleContrast}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Saturation</Typography.Text>
              <Slider
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={handleSaturation}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Vibrance</Typography.Text>
              <Slider
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={handleVibrance}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Gamma</Typography.Text>
              <Slider
                min={0.1}
                max={2.2}
                step={0.1}
                defaultValue={1}
                onChange={handleGamma}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Hue Rotation</Typography.Text>
              <Slider
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={handleHueRotation}
                onAfterChange={() => history.saveState()}
              />
            </div>
          </Space>
        </Panel>

        <Panel header="Effects" key="2">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Typography.Text>Blur</Typography.Text>
              <Slider
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={handleBlur}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Noise</Typography.Text>
              <Slider
                min={0}
                max={1000}
                defaultValue={0}
                onChange={handleNoise}
                onAfterChange={() => history.saveState()}
              />
            </div>
            <div>
              <Typography.Text>Pixelate</Typography.Text>
              <Slider
                min={1}
                max={20}
                defaultValue={1}
                onChange={handlePixelate}
                onAfterChange={() => history.saveState()}
              />
            </div>
          </Space>
        </Panel>

        <Panel header="Filters" key="3">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {FILTER_LIST.map((item) => {
              const isActive = !!(selectedObject as any)?.filters?.[item.index];
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
