import { message } from 'antd';
import { textEnhancement } from './textEnhancement';
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
export const handleOCR = async (
  imageFile: File | null,
  setExtractedText: (text: string) => void,
  setLoading: (loading: boolean) => void,
  language: string[],
  setStepImages: (steps: string[]) => void,
) => {
  if (!imageFile) {
    message.warning('Please upload an image first.');
    return null;
  }

  setLoading(true);

  try {
    const settings = loadSettings();

    let finalBlob: Blob;
    let steps: string[] = [];

    if (settings.textEnhancement) {
      // Use text enhance enhance if enabled
      const enhanceResult = await textEnhancement(imageFile);
      steps = enhanceResult.steps;
      finalBlob = enhanceResult.finalBlob;

      // Show preprocessing steps in UI
      setStepImages(steps);
    } else {
      // Skip preprocessing, use original image
      finalBlob = imageFile;
      setStepImages([URL.createObjectURL(imageFile)]); // just show original image
    }

    // OCR
    const result = await Tesseract.recognize(finalBlob, language.join('+'), {
      logger: (m) => console.log(m),
    });

    setExtractedText(result.data.text);
    return result.data;
  } catch (error) {
    console.error(error);
    message.error('Failed to extract text');
    throw error;
  } finally {
    setLoading(false);
  }
};
