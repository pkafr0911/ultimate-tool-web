import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Select, Slider, Spin } from 'antd';
import {
  FilePdfOutlined,
  PictureOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import JSZip from 'jszip';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * PDF → Image — Export PDF pages as PNG images
 */
const PdfToImage: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setImages([]);
    setProgress(0);
  };

  useEffect(() => {
    if (droppedFile) {
      const f = Array.isArray(droppedFile) ? droppedFile[0] : droppedFile;
      if (f) handleFile(f);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingFile(true);
    setProgress(10);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const results: { url: string; name: string }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const mimeType =
          format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const url = canvas.toDataURL(
          mimeType,
          format === 'jpeg' || format === 'webp' ? 0.92 : undefined,
        );
        const ext = format === 'jpeg' ? 'jpg' : format;
        const baseName = file.name.replace(/\.pdf$/i, '');
        results.push({ url, name: `${baseName}_page_${i}.${ext}` });

        setProgress(10 + Math.round((i / pdf.numPages) * 85));
      }

      setImages(results);
      setProgress(100);
      message.success(`Successfully exported ${results.length} pages as images!`);
    } catch (err) {
      console.error(err);
      message.error('Failed to convert PDF to images.');
    } finally {
      setLoading(false);
      setLoadingFile(false);
    }
  };

  const downloadAll = async () => {
    if (images.length === 0) return;
    if (images.length === 1) {
      const a = document.createElement('a');
      a.href = images[0].url;
      a.download = images[0].name;
      a.click();
      return;
    }
    const zip = new JSZip();
    for (const img of images) {
      const response = await fetch(img.url);
      const blob = await response.blob();
      zip.file(img.name, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.pdf$/i, '') || 'pages'}_images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingle = (img: { url: string; name: string }) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = img.name;
    a.click();
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('pdf-img-upload')?.click()}
      >
        <Upload
          id="pdf-img-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FilePdfOutlined className="dropZoneIcon" />
        <span className="dropZoneText">{file ? file.name : 'Drop or click to upload PDF'}</span>
        <span className="dropZoneHint">Each page will be exported as an image</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FilePdfOutlined className="fileItemIcon" />
            <div className="fileItemInfo">
              <div className="fileItemName">{file.name}</div>
              <div className="fileItemSize">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setFile(null);
                setImages([]);
              }}
            />
          </div>
        </div>
      )}

      {file && (
        <div className="settingsRow">
          <label>Format:</label>
          <Select
            value={format}
            onChange={setFormat}
            options={[
              { label: 'PNG', value: 'png' },
              { label: 'JPEG', value: 'jpeg' },
              { label: 'WEBP', value: 'webp' },
            ]}
            style={{ width: 100 }}
          />
          <label>Quality (scale):</label>
          <Slider
            min={1}
            max={4}
            step={0.5}
            value={scale}
            onChange={setScale}
            style={{ width: 150 }}
          />
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{scale}x</span>
        </div>
      )}

      {loadingFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
          <Spin tip="Generating image renders from PDF pages..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#2f54eb" />
        </div>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<PictureOutlined />}
          onClick={convert}
          loading={loading}
          disabled={!file || loadingFile}
        >
          Export as Images
        </Button>
        {images.length > 0 && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadAll}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Download All ({images.length})
          </Button>
        )}
      </Space>

      {images.length > 0 && (
        <div className="thumbnailGrid" style={{ marginTop: 24 }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="thumbnail"
              onClick={() => downloadSingle(img)}
              title="Click to download"
            >
              <img
                src={img.url}
                alt={img.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <div className="thumbnailLabel">Page {idx + 1}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default PdfToImage;
