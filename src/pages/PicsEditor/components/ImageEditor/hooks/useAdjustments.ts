import { useState } from 'react';

export const useAdjustments = () => {
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);

  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);

  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);

  const [dehaze, setDehaze] = useState(0);

  const [blur, setBlur] = useState(0);
  const [gaussian, setGaussian] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [texture, setTexture] = useState(0);
  const [clarity, setClarity] = useState(0);

  const [bgThreshold, setBgThreshold] = useState(0);
  const [bgThresholdBlack, setBgThresholdBlack] = useState(0);

  const [hslAdjustments, setHslAdjustmentsState] = useState<
    Record<string, { h?: number; s?: number; l?: number }>
  >({});

  const setHslAdjustments = (
    name: string,
    values: Partial<{ h: number; s: number; l: number }>,
  ) => {
    setHslAdjustmentsState((prev) => ({
      ...prev,
      [name]: { ...(prev[name] || {}), ...values },
    }));
  };

  return {
    brightness,
    setBrightness,
    contrast,
    setContrast,
    highlights,
    setHighlights,
    shadows,
    setShadows,
    whites,
    setWhites,
    blacks,
    setBlacks,
    vibrance,
    setVibrance,
    saturation,
    setSaturation,
    dehaze,
    setDehaze,
    blur,
    setBlur,
    gaussian,
    setGaussian,
    sharpen,
    setSharpen,
    texture,
    setTexture,
    clarity,
    setClarity,
    bgThreshold,
    setBgThreshold,
    bgThresholdBlack,
    setBgThresholdBlack,
    hslAdjustments,
    setHslAdjustmentsState,
    setHslAdjustments,
  };
};
