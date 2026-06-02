import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Input, Slider, Spin } from 'antd';
import { FilePdfOutlined, DownloadOutlined, FontSizeOutlined } from '@ant-design/icons';

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
 * Add Watermark — Overlay text watermark on PDF pages
 */
const WatermarkPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.15);
  const [rotation, setRotation] = useState(-45);
  const [color, setColor] = useState('#888888');

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

  const addWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    setLoading(true);
    setLoadingFile(true);
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const hex = color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;

      const cleanText = sanitizeForPdf(watermarkText);

      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(cleanText, fontSize);

        const spacingX = textWidth + 60;
        const spacingY = fontSize * 3;

        for (let y = -height; y < height * 2; y += spacingY) {
          for (let x = -width; x < width * 2; x += spacingX) {
            page.drawText(cleanText, {
              x: x,
              y: y,
              size: fontSize,
              font,
              color: rgb(r, g, b),
              opacity,
              rotate: degrees(rotation),
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      message.success('Watermark added successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to add watermark.');
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
    a.download = (file?.name.replace(/\.pdf$/, '') || 'watermarked') + '_watermarked.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('wm-upload')?.click()}
      >
        <Upload
          id="wm-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FontSizeOutlined className="dropZoneIcon" />
        <span className="dropZoneText">{file ? file.name : 'Drop or click to upload PDF'}</span>
        <span className="dropZoneHint">Add text watermark to all pages</span>
      </div>

      {file && (
        <>
          <div className="settingsRow" style={{ marginTop: 16 }}>
            <label>Text:</label>
            <Input
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              style={{ maxWidth: 250 }}
              prefix={<FontSizeOutlined />}
            />
          </div>

          <div className="settingsRow">
            <label>Font size:</label>
            <Slider
              min={12}
              max={120}
              value={fontSize}
              onChange={setFontSize}
              style={{ width: 150 }}
            />
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{fontSize}px</span>

            <label>Opacity:</label>
            <Slider
              min={0.01}
              max={0.5}
              step={0.01}
              value={opacity}
              onChange={setOpacity}
              style={{ width: 120 }}
            />
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{Math.round(opacity * 100)}%</span>
          </div>

          <div className="settingsRow">
            <label>Rotation:</label>
            <Slider
              min={-90}
              max={90}
              value={rotation}
              onChange={setRotation}
              style={{ width: 150 }}
            />
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{rotation}°</span>

            <label>Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
          </div>

          {/* Preview */}
          <div className="watermarkPreview" style={{ margin: '16px 0' }}>
            <div
              style={{
                width: 210,
                height: 297,
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 6,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: fontSize * 0.3,
                  fontWeight: 700,
                  color: color,
                  opacity: opacity,
                  transform: `rotate(${rotation}deg)`,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {watermarkText}
              </span>
            </div>
          </div>

          {loadingFile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
              <Spin tip="Embedding tiled text watermark on PDF layout streams..." />
            </div>
          )}

          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<FontSizeOutlined />}
              onClick={addWatermark}
              loading={loading}
              disabled={loadingFile}
            >
              Add Watermark
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
          </Space>
        </>
      )}
    </>
  );
};

export default WatermarkPdf;
