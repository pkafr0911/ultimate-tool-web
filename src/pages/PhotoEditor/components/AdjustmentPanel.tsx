import React from 'react';
import { Slider, Typography, Space } from 'antd';
import { usePhotoEditor } from '../context';
import { filters } from 'fabric';

const AdjustmentPanel: React.FC = () => {
  const { canvas, selectedObject, history } = usePhotoEditor();

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
    const filter = new filters.Pixelate({ blocksize: value });
    applyFilter(4, filter);
  };

  const handleBlur = (value: number) => {
    const filter = new filters.Blur({ blur: value });
    applyFilter(5, filter);
  };

  if (!selectedObject || !selectedObject.isType('image')) {
    return <div style={{ padding: 10 }}>Select an image to adjust</div>;
  }

  return (
    <div style={{ padding: 10 }}>
      <Typography.Title level={5}>Adjustments</Typography.Title>
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
      </Space>
    </div>
  );
};

export default AdjustmentPanel;
