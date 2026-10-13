import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { SavedProject } from '../types';
import { isTypingTarget } from '../utils/document';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const useImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [initialProject, setInitialProject] = useState<SavedProject | null>(null);
  const [addOnFile, updateAddOnFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const previewRef = useRef<string | null>(null);
  const queue = useRef<File[]>([]);
  const chain = useRef(Promise.resolve());
  const epoch = useRef(0);
  const setAddOnFile = useCallback((file: File | null) => {
    if (file) {
      queue.current.push(file);
      if (queue.current.length === 1) updateAddOnFile(file);
    } else {
      queue.current.shift();
      updateAddOnFile(queue.current[0] || null);
    }
  }, []);
  useEffect(
    () => () => {
      epoch.current++;
    },
    [],
  );
  const handleUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        message.error('Choose a supported image file.');
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        message.error('Image exceeds the 50 MB file limit.');
        return false;
      }
      const generation = epoch.current;
      chain.current = chain.current
        .then(async () => {
          if (generation !== epoch.current) return;
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Unable to read image.'));
            reader.readAsDataURL(file);
          });
          const img = new Image();
          img.src = data;
          await img.decode();
          if (img.naturalWidth * img.naturalHeight > 64_000_000)
            throw new Error('Image exceeds the 64 megapixel document limit.');
          if (generation !== epoch.current) return;
          if (previewRef.current) setAddOnFile(file);
          else {
            previewRef.current = data;
            setPreview(data);
            setInitialProject(null);
          }
        })
        .catch((error) => {
          if (generation === epoch.current)
            message.error(error.message || 'Unable to decode image.');
        });
      setDragging(false);
      dragCounter.current = 0;
      return false;
    },
    [setAddOnFile],
  );
  const loadProject = useCallback((project: SavedProject) => {
    epoch.current++;
    queue.current = [];
    updateAddOnFile(null);
    setInitialProject(project);
    previewRef.current = project.thumbnail;
    setPreview(project.thumbnail);
  }, []);
  const handleClear = useCallback(() => {
    epoch.current++;
    queue.current = [];
    previewRef.current = null;
    setPreview(null);
    updateAddOnFile(null);
    setInitialProject(null);
    message.info('Image cleared.');
  }, []);
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const image = Array.from(e.clipboardData?.items || [])
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();
      if (image) {
        handleUpload(image);
        e.preventDefault();
      }
    };
    window.addEventListener('paste', paste);
    return () => window.removeEventListener('paste', paste);
  }, [handleUpload]);
  return {
    preview,
    setPreview,
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
