import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  MergeCellsOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import FilePreview from './FilePreview';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Combine PDF — Merge multiple PDF files into one using pdf-lib
 */
const CombinePdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFiles = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(
      (f) => f.name.endsWith('.pdf'),
    );
    if (pdfFiles.length === 0) {
      message.error('Please upload PDF files.');
      return;
    }
    setFiles((prev) => [...prev, ...pdfFiles]);
    setResultBlob(null);
    setProgress(0);
  };

  useEffect(() => {
    if (droppedFile) {
      const list = Array.isArray(droppedFile) ? droppedFile : [droppedFile];
      handleFiles(list);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResultBlob(null);
  };

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const [moved] = newFiles.splice(from, 1);
      newFiles.splice(to, 0, moved);
      return newFiles;
    });
  };

  const merge = async () => {
    if (files.length < 2) {
      message.warning('Please add at least 2 PDF files to merge.');
      return;
    }
    setLoading(true);
    setProgress(10);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
        setProgress(10 + Math.round(((i + 1) / files.length) * 80));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      setProgress(100);
      message.success(`Merged ${files.length} PDFs successfully!`);
    } catch (err) {
      console.error(err);
      message.error('Failed to merge PDF files.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('combine-upload')?.click()}
      >
        <Upload
          id="combine-upload"
          beforeUpload={(f, fileList) => {
            handleFiles(fileList as any as File[]);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
          multiple
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <PlusOutlined className="dropZoneIcon" />
        <span className="dropZoneText">Drop or click to add PDF files</span>
        <span className="dropZoneHint">Add multiple PDFs — drag to reorder below</span>
      </div>

      {files.length > 0 && (
        <div className="fileList">
          {files.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="fileItem"
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) moveFile(dragIdx, idx);
                setDragIdx(null);
              }}
              style={{ cursor: 'grab', opacity: dragIdx === idx ? 0.5 : 1 }}
            >
              <MenuOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />
              <FilePdfOutlined className="fileItemIcon" />
              <div className="fileItemInfo">
                <div className="fileItemName">{f.name}</div>
                <div className="fileItemSize">{(f.size / 1024).toFixed(1)} KB</div>
              </div>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeFile(idx)}
              />
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
          <Spin tip="Merging pages and generating PDF..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#2f54eb" />
        </div>
      )}

      {resultBlob && (
        <FilePreview
          blob={resultBlob}
          fileName="merged.pdf"
          type="result"
        />
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<MergeCellsOutlined />}
          onClick={merge}
          loading={loading}
          disabled={files.length < 2}
        >
          Merge {files.length} PDFs
        </Button>
        {resultBlob && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={download}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Download Merged PDF
          </Button>
        )}
        {files.length > 0 && (
          <Button
            danger
            onClick={() => {
              setFiles([]);
              setResultBlob(null);
            }}
          >
            Clear All
          </Button>
        )}
      </Space>
    </>
  );
};

export default CombinePdf;
