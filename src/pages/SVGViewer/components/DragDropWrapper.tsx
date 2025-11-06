import React from 'react';

export const DragDropWrapper = ({ children, setDragging, dragCounter, handleUpload }: any) => (
  <div
    onDragEnter={(e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      setDragging(true);
    }}
    onDragOver={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDragLeave={(e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragging(false);
      }
    }}
    onDrop={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      dragCounter.current = 0;
      const files = e.dataTransfer.files;
      if (files.length > 0) handleUpload(files[0]);
    }}
    style={{ position: 'relative', minHeight: '100vh' }}
  >
    {children}
  </div>
);
