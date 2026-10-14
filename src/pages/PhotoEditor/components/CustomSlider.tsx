import { InputNumber, Slider } from 'antd';
import React from 'react';

export const SLIDER_GRADIENTS = {
  amount: 'linear-gradient(to right, #555, #ddd)',
  luminance: 'linear-gradient(to right, #000, #888, #fff)',
  saturation: 'linear-gradient(to right, #888, #ff4d4f)',
  hue: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
};

type CustomSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onChangeComplete?: () => void;
  gradient?: string;
  disabled?: boolean;
  onLabelMouseDown?: React.MouseEventHandler<HTMLSpanElement>;
};

export const CustomSlider = ({
  label,
  value,
  min,
  max,
  step = 1,
  gradient = SLIDER_GRADIENTS.amount,
  disabled = false,
  onLabelMouseDown,
  onChange,
  onChangeComplete,
}: CustomSliderProps) => (
  <div className="custom-slider-container">
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span
        className="custom-label"
        onMouseDown={disabled ? undefined : onLabelMouseDown}
        style={{
          fontSize: 12,
          ...(onLabelMouseDown && !disabled ? { cursor: 'ew-resize', userSelect: 'none' } : {}),
        }}
      >
        {label}
      </span>
      <InputNumber
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(v) => {
          if (v !== null && Number.isFinite(Number(v))) onChange(Number(v));
        }}
        onBlur={() => onChangeComplete?.()}
        className="custom-number"
        size="small"
        style={{ width: 64, fontSize: 12 }}
      />
    </div>

    <Slider
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      ariaLabelForHandle={label}
      onChange={onChange}
      onChangeComplete={onChangeComplete}
      className="custom-slider"
      style={{ margin: '6px 0 16px 0' }}
      styles={{
        rail: gradient ? { background: gradient } : undefined,
        track: gradient ? { background: 'transparent' } : undefined,
        handle: { opacity: 1 },
      }}
    />
  </div>
);
