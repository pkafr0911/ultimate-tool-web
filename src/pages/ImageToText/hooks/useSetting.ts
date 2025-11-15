import { useEffect, useState } from 'react';
import { OCRSettings } from '../constants';
import { loadSettings, saveSettings } from '../utils/helpers';

export const useSetting = () => {
  const [settings, setSettings] = useState<OCRSettings>(loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return { settings, setSettings };
};
