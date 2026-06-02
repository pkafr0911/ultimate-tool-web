import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ScissorOutlined,
} from '@ant-design/icons';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Delete PDF Pages — Remove specific pages from a PDF
 */
const DeletePdfPage: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setLoadingFile(true);
    setFile(f);
    setResultBlob(null);
    setSelectedPages(new Set());
    try {
      const ab = await f.arrayBuffer();
      setPdfBytes(ab);
    } catch {
      message.error('Failed to read PDF file.');
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    if (droppedFile) {
      const f = Array.isArray(droppedFile) ? droppedFile[0] : droppedFile;
      if (f) handleFile(f);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  // Generate thumbnails
  useEffect(() => {
    if (!pdfBytes) return;
    const genThumbs = async () => {
      setLoadingFile(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        setPageCount(pdf.numPages);

        const thumbs: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push(canvas.toDataURL('image/png'));
        }
        setThumbnails(thumbs);
      } catch (err) {
        console.error(err);
        message.error('Failed to render PDF page previews.');
      } finally {
        setLoadingFile(false);
      }
    };
    genThumbs();
  }, [pdfBytes]);

  const togglePage = (page: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
    setResultBlob(null);
  };

  const deletePages = async () => {
    if (!pdfBytes || selectedPages.size === 0) return;
    if (selectedPages.size >= pageCount) {
      message.error('Cannot delete all pages.');
      return;
    }
    setLoading(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const total = srcDoc.getPageCount();
      const keptIndices: number[] = [];
      for (let i = 0; i < total; i++) {
        if (!selectedPages.has(i + 1)) {
          keptIndices.push(i);
        }
      }

      const copiedPages = await newDoc.copyPages(srcDoc, keptIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const savedBytes = await newDoc.save();
      const blob = new Blob([savedBytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      message.success(`Removed ${selectedPages.size} pages successfully!`);
    } catch (err) {
      console.error(err);
      message.error('Failed to delete pages.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/, '') || 'trimmed') + '_trimmed.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!file ? (
        <div
          className="dropZone"
          onClick={() => document.getElementById('del-upload')?.click()}
        >
          <Upload
            id="del-upload"
            beforeUpload={(f) => {
              handleFile(f);
              return false;
            }}
            showUploadList={false}
            accept=".pdf"
          >
            <div style={{ display: 'none' }} />
          </Upload>
          <ScissorOutlined className="dropZoneIcon" />
          <span className="dropZoneText">Drop or click to upload PDF</span>
          <span className="dropZoneHint">Click pages below to select them for removal</span>
        </div>
      ) : (
        <>
          {loadingFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Loading PDF pages and generating previews..." />
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: '#595959' }}>
                Click on pages to select them for deletion. Selected:{' '}
                <strong>{selectedPages.size}</strong> of {pageCount} pages.
              </p>

              {thumbnails.length > 0 && (
                <div className="thumbnailGrid">
                  {thumbnails.map((src, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${selectedPages.has(idx + 1) ? 'selected' : ''}`}
                      onClick={() => togglePage(idx + 1)}
                      style={selectedPages.has(idx + 1) ? { opacity: 0.5 } : {}}
                    >
                      <img
                        src={src}
                        alt={`Page ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <div className="thumbnailLabel">Page {idx + 1}</div>
                      {selectedPages.has(idx + 1) && (
                        <div className="thumbnailCheck">
                          <DeleteOutlined />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!loadingFile && (
            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={deletePages}
                loading={loading}
                disabled={selectedPages.size === 0}
              >
                Delete {selectedPages.size} Pages
              </Button>
              {resultBlob && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={download}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Download
                </Button>
              )}
              <Button
                onClick={() => {
                  setFile(null);
                  setPdfBytes(null);
                  setThumbnails([]);
                  setSelectedPages(new Set());
                  setResultBlob(null);
                }}
              >
                Clear
              </Button>
            </Space>
          )}
        </>
      )}
    </>
  );
};

export default DeletePdfPage;
