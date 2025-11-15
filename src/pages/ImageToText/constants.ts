// --- Helpers for LocalStorage ---
export const SETTINGS_KEY = 'image_to_text_settings';

export type OCRSettings = {
  language: string[]; // e.g. ['eng', 'vie']
  upscaleMode: 'auto' | 'manual' | 'none';
  preprocessImage: boolean;
};

export const defaultSettings: OCRSettings = {
  language: ['eng', 'vie'], // e.g. ['eng', 'vie']
  upscaleMode: 'manual',
  preprocessImage: true,
};

export const languageOptions = [
  { label: 'English', value: 'eng' },
  { label: 'Vietnamese', value: 'vie' },
  { label: 'French', value: 'fra' },
  { label: 'Spanish', value: 'spa' },
  { label: 'German', value: 'deu' },
  { label: 'Italian', value: 'ita' },
  { label: 'Portuguese', value: 'por' },
  { label: 'Russian', value: 'rus' },
  { label: 'Simplified Chinese', value: 'chi_sim' },
  { label: 'Traditional Chinese', value: 'chi_tra' },
  { label: 'Japanese', value: 'jpn' },
  { label: 'Korean', value: 'kor' },
  { label: 'Arabic', value: 'ara' },
  { label: 'Hindi', value: 'hin' },
];
