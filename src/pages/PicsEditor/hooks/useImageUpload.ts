import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';

export const useImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [addOnFile, setAddOnFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (preview) {
          setAddOnFile(file);
        } else {
          setPreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
      setDragging(false);
      dragCounter.current = 0;
      return false;
    },
    [preview],
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setAddOnFile(null);
    message.info('Image cleared.');
  }, []);

  // --- Clipboard paste support ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) => item.type.includes('image'));
      if (imageItem) {
        const blob = imageItem.getAsFile();
        if (blob) {
          handleUpload(blob);
          message.success('Image pasted from clipboard!');
          e.preventDefault();
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleUpload]);

  return {
    preview,
    setPreview, // Exposed if needed
    addOnFile,
    setAddOnFile,
    dragging,
    setDragging,
    dragCounter,
    handleUpload,
    handleClear,
  };
};
