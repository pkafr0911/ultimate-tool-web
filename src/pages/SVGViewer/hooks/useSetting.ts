import { useEffect, useState } from 'react';
import { ViewerSettings } from '../constants';
import { loadSettings, saveSettings } from '../utils/helpers';

export const useSetting = () => {
  const [settings, setSettings] = useState<ViewerSettings>(loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return { settings, setSettings };
};
