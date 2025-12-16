import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { EditorSettings } from '../types';

const DEFAULT_SETTINGS: EditorSettings = {
  autoSaveInterval: 5,
  maxHistory: 20,
};

const SETTINGS_KEY = 'pics_editor_settings';

export const useEditorSettings = () => {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  const updateSettings = useCallback((newSettings: EditorSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    message.success('Settings saved');
  }, []);

  const toggleSettings = useCallback((show: boolean) => {
    setShowSettings(show);
  }, []);

  return {
    settings,
    showSettings,
    updateSettings,
    toggleSettings,
  };
};
