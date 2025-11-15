import { message } from 'antd';
import { preprocessImage } from './preprocessImage';
import Tesseract from 'tesseract.js';
import { defaultSettings, OCRSettings, SETTINGS_KEY } from '../constants';

// --- Helpers for LocalStorage ---
export const saveSettings = (settings: OCRSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): OCRSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const downloadText = (text: string) => {
  const blob = new Blob([text || ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = 'extracted-text.txt';
  a.href = url;
  a.click();
};

// --- OCR extraction ---
export const handleOCR = async (imageFile, setExtractedText, setLoading, language) => {
  if (!imageFile) return message.warning('Please upload an image first.');

  setLoading(true);

  try {
    const cleanedImage = await preprocessImage(imageFile);

    const result = await Tesseract.recognize(cleanedImage, language.join('+'), {
      logger: (m) => console.log(m),
    });

    setExtractedText(result.data.text);
    message.success('Text extracted successfully!');
  } catch (error) {
    console.error(error);
    message.error('Failed to extract text');
  } finally {
    setLoading(false);
  }
};
