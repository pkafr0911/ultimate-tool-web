import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Space, Tag, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  CompressOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Compress PDF — Optimize/compress PDF file size
 * Uses pdf-lib to rebuild the PDF, stripping unused objects
 */
const CompressPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setResultBlob(null);
    setStats(null);
  };

  useEffect(() => {
    if (droppedFile) {
      const f = Array.isArray(droppedFile) ? droppedFile[0] : droppedFile;
      if (f) handleFile(f);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingFile(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const originalSize = arrayBuffer.byteLength;

      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const pages = await newDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach((page) => newDoc.addPage(page));

      newDoc.setTitle(srcDoc.getTitle() || '');
      newDoc.setAuthor(srcDoc.getAuthor() || '');
      newDoc.setSubject(srcDoc.getSubject() || '');

      const pdfBytes = await newDoc.save({
        useObjectStreams: true,
      });

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      setStats({
        original: originalSize,
        compressed: pdfBytes.length,
      });

      const ratio = ((1 - pdfBytes.length / originalSize) * 100).toFixed(1);
      if (Number(ratio) > 0) {
        message.success(`Compressed by ${ratio}% successfully!`);
      } else {
        message.info('PDF is already optimized. No significant size reduction achieved.');
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to compress PDF.');
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
    a.download = (file?.name.replace(/\.pdf$/, '') || 'compressed') + '_compressed.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('compress-upload')?.click()}
      >
        <Upload
          id="compress-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <CompressOutlined className="dropZoneIcon" />
        <span className="dropZoneText">{file ? file.name : 'Drop or click to upload PDF'}</span>
        <span className="dropZoneHint">Optimize and reduce PDF file size</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FilePdfOutlined className="fileItemIcon" />
            <div className="fileItemInfo">
              <div className="fileItemName">{file.name}</div>
              <div className="fileItemSize">{formatBytes(file.size)}</div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="resultArea" style={{ margin: '16px 0' }}>
          <div className="resultTitle">
            <ThunderboltOutlined /> Compression Result
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <Tag>Original: {formatBytes(stats.original)}</Tag>
            <Tag color="blue">Compressed: {formatBytes(stats.compressed)}</Tag>
            <Tag color={stats.compressed < stats.original ? 'green' : 'orange'}>
              {stats.compressed < stats.original
                ? `${((1 - stats.compressed / stats.original) * 100).toFixed(1)}% smaller`
                : 'No reduction'}
            </Tag>
          </div>
        </div>
      )}

      {loadingFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
          <Spin tip="Compressing resources, stripping redundant metadata & streams..." />
        </div>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<CompressOutlined />}
          onClick={compress}
          loading={loading}
          disabled={!file || loadingFile}
        >
          Compress PDF
        </Button>
        {resultBlob && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={download}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Download Compressed
          </Button>
        )}
      </Space>
    </>
  );
};

export default CompressPdf;
