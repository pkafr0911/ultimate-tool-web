import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Spin } from 'antd';
import {
  FilePdfOutlined,
  FileSearchOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { handleCopy } from '@/helpers';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * PDF OCR — Extract text from scanned PDF using pdfjs-dist + Tesseract.js
 */
const PdfOcr: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [ocrText, setOcrText] = useState('');

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setOcrText('');
    setProgress(0);
  };

  useEffect(() => {
    if (droppedFile) {
      const f = Array.isArray(droppedFile) ? droppedFile[0] : droppedFile;
      if (f) handleFile(f);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  const runOcr = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(5);
    setProgressText('Loading PDF document structure...');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setProgress(10);
      setProgressText('Initializing Tesseract OCR WebAssembly engine...');

      const Tesseract = await import('tesseract.js');

      let allText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgressText(`Recognizing and extracting page ${i}/${pdf.numPages}...`);

        const page = await pdf.getPage(i);

        const textContent = await page.getTextContent();
        const nativeText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();

        if (nativeText.length > 50) {
          allText += `--- Page ${i} ---\n${nativeText}\n\n`;
        } else {
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;

          const imageData = canvas.toDataURL('image/png');

          const result = await Tesseract.recognize(imageData, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text' && m.progress) {
                const pageProgress =
                  10 + ((i - 1) / pdf.numPages) * 85 + (m.progress / pdf.numPages) * 85;
                setProgress(Math.min(Math.round(pageProgress), 95));
              }
            },
          });

          allText += `--- Page ${i} (OCR) ---\n${result.data.text}\n\n`;
        }

        setProgress(10 + Math.round((i / pdf.numPages) * 85));
      }

      setOcrText(allText.trim());
      setProgress(100);
      setProgressText('');
      message.success('OCR completed successfully!');
    } catch (err) {
      console.error(err);
      message.error('OCR processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadText = () => {
    if (!ocrText) return;
    const blob = new Blob([ocrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/, '') || 'ocr') + '_text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('ocr-upload')?.click()}
      >
        <Upload
          id="ocr-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FileSearchOutlined className="dropZoneIcon" />
        <span className="dropZoneText">{file ? file.name : 'Drop or click to upload PDF'}</span>
        <span className="dropZoneHint">Extract text from scanned PDFs using OCR</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FilePdfOutlined className="fileItemIcon" />
            <div className="fileItemInfo">
              <div className="fileItemName">{file.name}</div>
              <div className="fileItemSize">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
          <Spin size="large" tip={progressText || "Processing OCR..."} />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea" style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" strokeColor="#2f54eb" />
        </div>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<FileSearchOutlined />}
          onClick={runOcr}
          loading={loading}
          disabled={!file}
        >
          Run OCR
        </Button>
        {ocrText && (
          <>
            <Button icon={<CopyOutlined />} onClick={() => handleCopy(ocrText, 'OCR text copied!')}>
              Copy Text
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadText}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Download .txt
            </Button>
          </>
        )}
      </Space>

      {ocrText && (
        <div style={{ marginTop: 16 }}>
          <textarea className="ocrResult" value={ocrText} readOnly rows={15} style={{ width: '100%', borderRadius: 8, padding: 12, border: '1px solid #d9d9d9', fontFamily: 'monospace' }} />
        </div>
      )}
    </>
  );
};

export default PdfOcr;
