import { InputNumber, Slider, Space } from 'antd';

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
    <div style={{ width: '100%' }}>
      <span className="custom-label">{label}</span>
      <InputNumber
        min={min}
        max={max}
        value={value}
        onChange={(v) => onChange(Number(v))}
        onBlur={() => onChangeComplete?.()}
        className="custom-number"
        size="small"
      />
    </div>

    <Slider
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      onChangeComplete={onChangeComplete}
      className="custom-slider"
      style={{ '--custom-slider-gradient': gradient } as React.CSSProperties}
      handleStyle={{ opacity: 1 }}
    />
  </div>
);
