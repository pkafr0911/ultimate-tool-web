// --- Helpers for LocalStorage ---
export const SETTINGS_KEY = 'svg_viewer_settings';

export type ViewerSettings = {
  highlightBorder: boolean;
  highlightArea: boolean;
  lockRatio: boolean;
  uploadStack: boolean;
  optimizeBeforePrettify: boolean;
};

export const defaultSettings: ViewerSettings = {
  highlightBorder: false,
  highlightArea: true,
  lockRatio: false,
  uploadStack: true,
  optimizeBeforePrettify: false,
};
