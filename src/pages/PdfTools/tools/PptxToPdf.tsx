import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Spin } from 'antd';
import {
  FilePptOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import FilePreview from './FilePreview';

const ACCEPTED = '.pptx,.ppt,.odp';

// Map common Vietnamese/Unicode characters to WinAnsi equivalents so standard fonts don't crash
const sanitizeForPdf = (str: string): string => {
  const map: Record<string, string> = {
    à: 'a',
    á: 'a',
    ả: 'a',
    ã: 'a',
    ạ: 'a',
    ă: 'a',
    ằ: 'a',
    ắ: 'a',
    ẳ: 'a',
    ẵ: 'a',
    ặ: 'a',
    â: 'a',
    ầ: 'a',
    ấ: 'a',
    ẩ: 'a',
    ẫ: 'a',
    ậ: 'a',
    đ: 'd',
    è: 'e',
    é: 'e',
    ẻ: 'e',
    ẽ: 'e',
    ẹ: 'e',
    ê: 'e',
    ề: 'e',
    ế: 'e',
    ể: 'e',
    ễ: 'e',
    ệ: 'e',
    ì: 'i',
    í: 'i',
    ỉ: 'i',
    ĩ: 'i',
    ị: 'i',
    ò: 'o',
    ó: 'o',
    ỏ: 'o',
    õ: 'o',
    ọ: 'o',
    ô: 'o',
    ồ: 'o',
    ố: 'o',
    ổ: 'o',
    ỗ: 'o',
    ộ: 'o',
    ơ: 'o',
    ờ: 'o',
    ớ: 'o',
    ở: 'o',
    ỡ: 'o',
    ợ: 'o',
    ù: 'u',
    ú: 'u',
    ủ: 'u',
    ũ: 'u',
    ụ: 'u',
    ư: 'u',
    ừ: 'u',
    ứ: 'u',
    ử: 'u',
    ữ: 'u',
    ự: 'u',
    ỳ: 'y',
    ý: 'y',
    ỷ: 'y',
    ỹ: 'y',
    ỵ: 'y',
    À: 'A',
    Á: 'A',
    Ả: 'A',
    Ã: 'A',
    Ạ: 'A',
    Ă: 'A',
    Ằ: 'A',
    Ắ: 'A',
    Ẳ: 'A',
    Ẵ: 'A',
    Ặ: 'A',
    Â: 'A',
    Ầ: 'A',
    Ấ: 'A',
    Ẩ: 'A',
    Ẫ: 'A',
    Ậ: 'A',
    Đ: 'D',
    È: 'E',
    É: 'E',
    Ẻ: 'E',
    Ẽ: 'E',
    Ẹ: 'E',
    Ê: 'E',
    Ề: 'E',
    Ế: 'E',
    Ể: 'E',
    Ễ: 'E',
    Ệ: 'E',
    Ì: 'I',
    Í: 'I',
    Ỉ: 'I',
    Ĩ: 'I',
    Ị: 'I',
    Ò: 'O',
    Ó: 'O',
    Ỏ: 'O',
    Õ: 'O',
    Ọ: 'O',
    Ô: 'O',
    Ồ: 'O',
    Ố: 'O',
    Ổ: 'O',
    Ỗ: 'O',
    Ộ: 'O',
    Ơ: 'O',
    Ờ: 'O',
    Ớ: 'O',
    Ở: 'O',
    Ỡ: 'O',
    Ợ: 'O',
    Ù: 'U',
    Ú: 'U',
    Ủ: 'U',
    Ũ: 'U',
    Ụ: 'U',
    Ư: 'U',
    Ừ: 'U',
    Ứ: 'U',
    Ử: 'U',
    Ữ: 'U',
    Ự: 'U',
    Ỳ: 'Y',
    Ý: 'Y',
    Ỷ: 'Y',
    Ỹ: 'Y',
    Ỵ: 'Y',
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
 * PowerPoint → PDF — Convert presentation files to PDF
 * Supports: PPTX, ODP (extracts text + basic layout)
 */
const PptxToPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pptx', 'ppt', 'odp'].includes(ext || '')) {
      message.error('Please upload a PowerPoint file (PPTX, ODP).');
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
    setProgress(10);
    try {
      const JSZip = (await import('jszip')).default;
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

      setProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const ext = file.name.split('.').pop()?.toLowerCase();

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const slideW = 960;
      const slideH = 540;

      if (ext === 'pptx' || ext === 'ppt') {
        const slideFiles = Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
          .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)![0]);
            const nb = parseInt(b.match(/\d+/)![0]);
            return na - nb;
          });

        for (let i = 0; i < slideFiles.length; i++) {
          const xml = await zip.file(slideFiles[i])!.async('string');
          const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
          const texts = textMatches
            .map((m) =>
              m
                .replace(/<a:t>/, '')
                .replace(/<\/a:t>/, '')
                .trim(),
            )
            .filter(Boolean);

          const page = pdfDoc.addPage([slideW, slideH]);

          page.drawRectangle({
            x: 0,
            y: 0,
            width: slideW,
            height: slideH,
            color: rgb(0.98, 0.98, 1),
          });

          page.drawText(`Slide ${i + 1}`, {
            x: slideW - 80,
            y: 15,
            size: 10,
            font,
            color: rgb(0.6, 0.6, 0.7),
          });

          let y = slideH - 60;
          for (const text of texts) {
            if (y < 40) break;
            const isTitle = texts.indexOf(text) === 0;
            page.drawText(sanitizeForPdf(text).slice(0, 80), {
              x: 50,
              y,
              size: isTitle ? 24 : 14,
              font: isTitle ? fontBold : font,
              color: rgb(0.15, 0.15, 0.2),
            });
            y -= isTitle ? 40 : 24;
          }

          setProgress(20 + Math.round(((i + 1) / slideFiles.length) * 70));
        }
      } else if (ext === 'odp') {
        const contentXml = await zip.file('content.xml')?.async('string');
        if (contentXml) {
          const pageMatches = contentXml.match(/<draw:page[^>]*>[\s\S]*?<\/draw:page>/g) || [];
          for (let i = 0; i < pageMatches.length; i++) {
            const slideXml = pageMatches[i];
            const textMatches = slideXml.match(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g) || [];
            const texts = textMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

            const page = pdfDoc.addPage([slideW, slideH]);
            page.drawRectangle({
              x: 0,
              y: 0,
              width: slideW,
              height: slideH,
              color: rgb(0.98, 0.98, 1),
            });

            let y = slideH - 60;
            for (const text of texts) {
              if (y < 40) break;
              const isTitle = texts.indexOf(text) === 0;
              page.drawText(sanitizeForPdf(text).slice(0, 80), {
                x: 50,
                y,
                size: isTitle ? 24 : 14,
                font: isTitle ? fontBold : font,
                color: rgb(0.15, 0.15, 0.2),
              });
              y -= isTitle ? 40 : 24;
            }

            setProgress(20 + Math.round(((i + 1) / pageMatches.length) * 70));
          }
        }
      }

      setProgress(95);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setProgress(100);
      message.success('Presentation converted successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to convert presentation to PDF.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, '') || 'presentation') + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="dropZone" onClick={() => document.getElementById('pptx-pdf-upload')?.click()}>
        <Upload
          id="pptx-pdf-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept={ACCEPTED}
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FilePptOutlined className="dropZoneIcon" style={{ color: '#d04423' }} />
        <span className="dropZoneText">
          {file ? file.name : 'Drop or click to upload presentation'}
        </span>
        <span className="dropZoneHint">Supports: PPTX, PPT, ODP</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FilePptOutlined className="fileItemIcon" style={{ color: '#d04423' }} />
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

      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 0',
          }}
        >
          <Spin tip="Parsing presentation slides, shapes, and generating vector slide PDF..." />
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
          fileName={(file?.name.replace(/\.[^.]+$/, '') || 'presentation') + '.pdf'}
          type="result"
        />
      )}

      <Space>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={convert}
          loading={loading}
          disabled={!file}
          style={{ background: '#d04423', borderColor: '#d04423' }}
        >
          Convert to PDF
        </Button>
        {resultBlob && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={download}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Download PDF
          </Button>
        )}
      </Space>
    </>
  );
};

export default PptxToPdf;
