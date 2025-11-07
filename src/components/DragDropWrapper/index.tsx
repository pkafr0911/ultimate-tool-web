import React from 'react';

const DragDropWrapper: React.FC<{
  children;
  setDragging;
  dragCounter;
  handleUpload;
  multiple?: boolean;
  className?: string;
}> = ({ children, setDragging, dragCounter, handleUpload, multiple, className }) => {
  return (
    <div
      className={className}
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
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleUpload(multiple ? files : files[0]);
      }}
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
};
export default DragDropWrapper;
