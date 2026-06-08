import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Spin } from 'antd';
import {
  FilePdfOutlined,
  FilePptOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import FilePreview from './FilePreview';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * PDF → PowerPoint — Convert PDF pages to PPTX slides (each page as an image)
 */
const PdfToPptx: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setResultBlob(null);
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
      const PptxGenJS = (await import('pptxgenjs')).default;

      setProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imageData = canvas.toDataURL('image/png');

        const slide = pptx.addSlide();
        slide.addImage({
          data: imageData,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        });

        slide.addText(`Page ${i}`, {
          x: 11.5,
          y: 6.9,
          w: 1.5,
          h: 0.4,
          fontSize: 10,
          color: '999999',
          align: 'right',
        });

        setProgress(20 + Math.round((i / pdf.numPages) * 70));
      }

      setProgress(92);
      const pptxBlob = (await pptx.write({ outputType: 'blob' })) as Blob;
      setResultBlob(pptxBlob);
      setProgress(100);
      message.success(`Converted ${pdf.numPages} pages to PowerPoint!`);
    } catch (err) {
      console.error(err);
      message.error('Failed to convert PDF to PowerPoint.');
    } finally {
      setLoading(false);
      setLoadingFile(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/, '') || 'presentation') + '.pptx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('pdf-pptx-upload')?.click()}
      >
        <Upload
          id="pdf-pptx-upload"
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
        <span className="dropZoneHint">Each PDF page becomes a PowerPoint slide</span>
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
                setResultBlob(null);
              }}
            />
          </div>
        </div>
      )}

      {file && <FilePreview file={file} type="source" />}

      {loadingFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
          <Spin tip="Rendering PDF pages to slide snapshots..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#d04423" />
        </div>
      )}

      {resultBlob && (
        <FilePreview
          blob={resultBlob}
          fileName={(file?.name.replace(/\.pdf$/, '') || 'presentation') + '.pptx'}
          type="result"
        />
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<FilePptOutlined />}
          onClick={convert}
          loading={loading}
          disabled={!file || loadingFile}
          style={{ background: '#d04423', borderColor: '#d04423' }}
        >
          Convert to PPTX
        </Button>
        {resultBlob && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={download}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Download PPTX
          </Button>
        )}
      </Space>
    </>
  );
};

export default PdfToPptx;
