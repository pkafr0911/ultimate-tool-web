import React, { useState, useRef, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Input, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';

// Map common Vietnamese/Unicode characters to WinAnsi equivalents so standard fonts don't crash
const sanitizeForPdf = (str: string): string => {
  const map: Record<string, string> = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a','â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'đ':'d','è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
    'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
    'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    'À':'A','Á':'A','Ả':'A','Ã':'A','Ạ':'A','Ă':'A','Ằ':'A','Ắ':'A','Ẳ':'A','Ẵ':'A','Ặ':'A','Â':'A','Ầ':'A','Ấ':'A','Ẩ':'A','Ẫ':'A','Ậ':'A',
    'Đ':'D','È':'E','É':'E','Ẻ':'E','Ẽ':'E','Ẹ':'E','Ê':'E','Ề':'E','Ế':'E','Ể':'E','Ễ':'E','Ệ':'E',
    'Ì':'I','Í':'I','Ỉ':'I','Ĩ':'I','Ị':'I',
    'Ò':'O','Ó':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ô':'O','Ồ':'O','Ố':'O','Ổ':'O','Ỗ':'O','Ộ':'O','Ơ':'O','Ờ':'O','Ớ':'O','Ở':'O','Ỡ':'O','Ợ':'O',
    'Ù':'U','Ú':'U','Ủ':'U','Ũ':'U','Ụ':'U','Ư':'U','Ừ':'U','Ứ':'U','Ử':'U','Ữ':'U','Ự':'U',
    'Ỳ':'Y','Ý':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y'
  };
  let res = '';
  for (const c of str) {
    if (map[c]) {
      res += map[c];
    } else if (c.charCodeAt(0) < 128) {
      res += c;
    } else {
      res += ' '; // fallback for unsupported special chars
    }
  }
  return res;
};

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Edit PDF — Add text annotations to PDF pages
 */
const EditPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState<
    { page: number; x: number; y: number; text: string }[]
  >([]);
  const [annotText, setAnnotText] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
      return;
    }
    setLoadingFile(true);
    setFile(f);
    setResultBlob(null);
    setAnnotations([]);
    try {
      const ab = await f.arrayBuffer();
      setPdfBytes(ab);

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      setPageCount(pdf.numPages);
      setCurrentPage(1);
    } catch {
      message.error('Failed to read PDF.');
    } finally {
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

  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return;
    const render = async () => {
      setLoadingFile(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        ctx.font = '16px Arial';
        ctx.fillStyle = '#E8453C';
        annotations
          .filter((a) => a.page === currentPage)
          .forEach((a) => {
            ctx.fillText(a.text, a.x, a.y);
          });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFile(false);
      }
    };
    render();
  }, [pdfBytes, currentPage, annotations]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotText || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setAnnotations((prev) => [...prev, { page: currentPage, x, y, text: annotText }]);
    message.success('Annotation added! Click on another spot to place it there too.');
  };

  const save = async () => {
    if (!pdfBytes) return;
    setLoading(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const annot of annotations) {
        const page = pdfDoc.getPage(annot.page - 1);
        const { height } = page.getSize();
        const scale = 1 / 1.2;
        page.drawText(sanitizeForPdf(annot.text), {
          x: annot.x * scale,
          y: height - annot.y * scale,
          size: 14,
          font,
          color: rgb(0.91, 0.27, 0.24),
        });
      }

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(savedBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      message.success('PDF saved successfully with your annotations!');
    } catch (err) {
      console.error(err);
      message.error('Failed to save edited PDF.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/, '') || 'edited') + '_edited.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!file ? (
        <div
          className="dropZone"
          onClick={() => document.getElementById('edit-upload')?.click()}
        >
          <Upload
            id="edit-upload"
            beforeUpload={(f) => {
              handleFile(f);
              return false;
            }}
            showUploadList={false}
            accept=".pdf"
          >
            <div style={{ display: 'none' }} />
          </Upload>
          <EditOutlined className="dropZoneIcon" />
          <span className="dropZoneText">Drop or click to upload PDF to edit</span>
          <span className="dropZoneHint">Add text annotations by clicking on pages</span>
        </div>
      ) : (
        <>
          <div className="settingsRow">
            <Input
              prefix={<FontSizeOutlined />}
              placeholder="Type annotation text, then click on page to place it"
              value={annotText}
              onChange={(e) => setAnnotText(e.target.value)}
              style={{ maxWidth: 400 }}
            />
            <Space>
              <Button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                ← Prev
              </Button>
              <span style={{ fontWeight: 600 }}>
                Page {currentPage} / {pageCount}
              </span>
              <Button
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </Button>
            </Space>
          </div>

          {loadingFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <Spin size="large" tip="Rendering page canvas..." />
            </div>
          ) : (
            <div
              style={{
                overflow: 'auto',
                border: '1px solid rgba(47,84,235,0.12)',
                borderRadius: 12,
                padding: 8,
                marginBottom: 16,
              }}
            >
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{ cursor: annotText ? 'crosshair' : 'default', maxWidth: '100%', display: 'block', margin: '0 auto' }}
              />
            </div>
          )}

          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={save}
              loading={loading}
              disabled={annotations.length === 0 || loadingFile}
            >
              Save PDF ({annotations.length} annotations)
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
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setFile(null);
                setPdfBytes(null);
                setAnnotations([]);
                setResultBlob(null);
              }}
            >
              Clear
            </Button>
          </Space>
        </>
      )}
    </>
  );
};

export default EditPdf;
