import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Space, Input, Spin } from 'antd';
import { UnlockOutlined, DownloadOutlined, LockOutlined } from '@ant-design/icons';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Unlock PDF — Remove password protection from PDF files
 */
const UnlockPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setFile(f);
    setResultBlob(null);
  };

  useEffect(() => {
    if (droppedFile) {
      const f = Array.isArray(droppedFile) ? droppedFile[0] : droppedFile;
      if (f) handleFile(f);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  const unlock = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingFile(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();

      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });

      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      message.success('PDF unlocked successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to unlock PDF. The file may have strong encryption.');
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
    a.download = (file?.name.replace(/\.pdf$/, '') || 'unlocked') + '_unlocked.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('unlock-upload')?.click()}
      >
        <Upload
          id="unlock-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <LockOutlined className="dropZoneIcon" />
        <span className="dropZoneText">
          {file ? file.name : 'Drop or click to upload locked PDF'}
        </span>
        <span className="dropZoneHint">Remove password protection from PDF files</span>
      </div>

      {file && (
        <>
          <div className="settingsRow" style={{ marginTop: 16 }}>
            <label>Password (if required):</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter PDF password"
              style={{ maxWidth: 280 }}
            />
          </div>

          {loadingFile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
              <Spin tip="Decrypting and stripping PDF protection parameters..." />
            </div>
          )}

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<UnlockOutlined />} onClick={unlock} loading={loading} disabled={loadingFile}>
              Unlock PDF
            </Button>
            {resultBlob && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={download}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Download Unlocked PDF
              </Button>
            )}
          </Space>
        </>
      )}
    </>
  );
};

export default UnlockPdf;
