import { InputNumber, Slider, Space } from 'antd';
import React from 'react';

type CustomSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onChangeComplete?: () => void;
  gradient?: string; // 👈 dynamic CSS gradient for track
};

export const CustomSlider = ({
  label,
  value,
  min,
  max,
  gradient,
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
      <span className="custom-label" style={{ fontSize: 12 }}>
        {label}
      </span>
      <InputNumber
        min={min}
        max={max}
        value={value}
        onChange={(v) => onChange(Number(v))}
        onBlur={() => onChangeComplete?.()}
        className="custom-number"
        size="small"
        style={{ width: 50, fontSize: 12 }}
      />
    </div>

    <Slider
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      onChangeComplete={onChangeComplete}
      className="custom-slider"
      style={
        { '--custom-slider-gradient': gradient, margin: '6px 0 16px 0' } as React.CSSProperties
      }
      handleStyle={{ opacity: 1 }}
    />
  </div>
);
