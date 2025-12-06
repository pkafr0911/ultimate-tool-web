import { useState, useRef } from 'react';
import { Layer } from '../../../types';

export const useTextTool = () => {
  const [textContent, setTextContent] = useState('');
  const [textFont, setTextFont] = useState('Arial');
  const [textFontSize, setTextFontSize] = useState(32);
  const [textColor, setTextColor] = useState('#000000');
  const [textWeight, setTextWeight] = useState<Layer['fontWeight']>('normal');
  const [textItalic, setTextItalic] = useState(false);
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>(
    'none',
  );
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isAddingText, setIsAddingText] = useState(false); // track if user clicked to place text
  const inlineEditorRef = useRef<HTMLTextAreaElement | null>(null);

  return {
    textContent,
    setTextContent,
    textFont,
    setTextFont,
    textFontSize,
    setTextFontSize,
    textColor,
    setTextColor,
    textWeight,
    setTextWeight,
    textItalic,
    setTextItalic,
    textDecoration,
    setTextDecoration,
    textAlign,
    setTextAlign,
    isAddingText,
    setIsAddingText,
    inlineEditorRef,
  };
};
