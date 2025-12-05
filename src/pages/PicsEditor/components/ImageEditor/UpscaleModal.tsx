import React from 'react';
import { Modal, InputNumber, Radio, Slider } from 'antd';

type Props = {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  upscaleFactor: number;
  setUpscaleFactor: (v: number) => void;
  presetLocal: 'low' | 'medium' | 'high';
  setPresetLocal: (v: 'low' | 'medium' | 'high') => void;
  sharpenAmount: number;
  setSharpenAmount: (v: number) => void;
  edgeEnhancement: number;
  setEdgeEnhancement: (v: number) => void;
  denoiseAmount: number;
  setDenoiseAmount: (v: number) => void;
};

const UpscaleModal: React.FC<Props> = ({
  open,
  onCancel,
  onOk,
  upscaleFactor,
  setUpscaleFactor,
  presetLocal,
  setPresetLocal,
  sharpenAmount,
  setSharpenAmount,
  edgeEnhancement,
  setEdgeEnhancement,
  denoiseAmount,
  setDenoiseAmount,
}) => {
  return (
    <Modal
      title="Custom Upscale"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Upscale"
      width={500}
      maskClosable={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ minWidth: 120 }}>
            <div>Multiplier</div>
            <InputNumber
              min={1}
              max={8}
              step={0.1}
              value={upscaleFactor}
              onChange={(v) => setUpscaleFactor(Number(v || 1))}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div>Smoothing Quality</div>
            <div style={{ marginTop: 8 }}>
              <Radio.Group
                value={presetLocal}
                onChange={(e) => setPresetLocal(e.target.value)}
                options={[
                  { label: 'Low', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                ]}
                optionType="button"
                buttonStyle="solid"
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Quality Enhancements</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Sharpen</span>
              <span>{sharpenAmount}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              value={sharpenAmount}
              onChange={setSharpenAmount}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Edge Enhancement</span>
              <span>{edgeEnhancement}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              value={edgeEnhancement}
              onChange={setEdgeEnhancement}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Denoise</span>
              <span>{denoiseAmount}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              value={denoiseAmount}
              onChange={setDenoiseAmount}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UpscaleModal;
