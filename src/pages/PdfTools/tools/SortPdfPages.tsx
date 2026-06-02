import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Space, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  SortAscendingOutlined,
  MenuOutlined,
} from '@ant-design/icons';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Sort PDF Pages — Reorder pages via drag-and-drop
 */
const SortPdfPages: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setLoadingFile(true);
    setFile(f);
    setResultBlob(null);
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

        const thumbs: string[] = [];
        const newOrder: number[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs.push(canvas.toDataURL('image/png'));
          newOrder.push(i - 1);
        }
        setThumbnails(thumbs);
        setOrder(newOrder);
      } catch (err) {
        console.error(err);
        message.error('Failed to render PDF page previews.');
      } finally {
        setLoadingFile(false);
      }
    };
    genThumbs();
  }, [pdfBytes]);

  const handleDrop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragIdx(null);
    setResultBlob(null);
  };

  const save = async () => {
    if (!pdfBytes) return;
    setLoading(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const pages = await newDoc.copyPages(srcDoc, order);
      pages.forEach((page) => newDoc.addPage(page));

      const savedBytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(savedBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      message.success('Pages reordered successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to reorder pages.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/, '') || 'sorted') + '_sorted.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!file ? (
        <div
          className="dropZone"
          onClick={() => document.getElementById('sort-upload')?.click()}
        >
          <Upload
            id="sort-upload"
            beforeUpload={(f) => {
              handleFile(f);
              return false;
            }}
            showUploadList={false}
            accept=".pdf"
          >
            <div style={{ display: 'none' }} />
          </Upload>
          <SortAscendingOutlined className="dropZoneIcon" />
          <span className="dropZoneText">Drop or click to upload PDF</span>
          <span className="dropZoneHint">Drag pages to reorder them</span>
        </div>
      ) : (
        <>
          {loadingFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Loading PDF pages and rendering previews..." />
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: '#595959' }}>
                Drag and drop pages to reorder. Current order: {order.map((o) => o + 1).join(', ')}
              </p>

              {thumbnails.length > 0 && (
                <div className="thumbnailGrid">
                  {order.map((pageIdx, displayIdx) => (
                    <div
                      key={`${pageIdx}-${displayIdx}`}
                      className="thumbnail"
                      draggable
                      onDragStart={() => setDragIdx(displayIdx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(displayIdx)}
                      style={{
                        cursor: 'grab',
                        opacity: dragIdx === displayIdx ? 0.5 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <img
                        src={thumbnails[pageIdx]}
                        alt={`Page ${pageIdx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      <div className="thumbnailLabel">
                        <MenuOutlined style={{ marginRight: 4 }} />
                        Page {pageIdx + 1}
                      </div>
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
                icon={<SortAscendingOutlined />}
                onClick={save}
                loading={loading}
              >
                Save New Order
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
                  setOrder([]);
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

export default SortPdfPages;
