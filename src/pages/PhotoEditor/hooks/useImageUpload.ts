import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { SavedProject } from '../types';

export const useImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [initialProject, setInitialProject] = useState<SavedProject | null>(null);
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
          setInitialProject(null);
        }
      };
      reader.readAsDataURL(file);
      setDragging(false);
      dragCounter.current = 0;
      return false;
    },
    [preview],
  );

  const loadProject = useCallback((project: SavedProject) => {
    setInitialProject(project);
    setPreview(project.thumbnail);
  }, []);

  const handleClear = useCallback(() => {
    setPreview(null);
    setAddOnFile(null);
    setInitialProject(null);
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
    loadProject,
    initialProject,
  };
};
