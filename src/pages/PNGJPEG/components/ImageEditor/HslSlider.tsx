import { InputNumber, Slider } from 'antd';

type HslSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onChangeComplete?: () => void;
  gradient: string; // 👈 dynamic CSS gradient for track
};

export const HslSlider = ({
  label,
  value,
  min,
  max,
  gradient,
  onChange,
  onChangeComplete,
}: HslSliderProps) => (
  <div className="hsl-slider-container">
    <span className="hsl-label">{label}</span>

    <Slider
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      onChangeComplete={onChangeComplete}
      className="hsl-slider"
      trackStyle={{ background: gradient }}
      railStyle={{ background: gradient }}
      handleStyle={{ opacity: 1 }}
    />

    <InputNumber
      min={min}
      max={max}
      value={value}
      onChange={(v) => onChange(Number(v))}
      onBlur={() => onChangeComplete?.()}
      className="hsl-number"
      size="small"
    />
  </div>
);
