import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Tag, Spin } from 'antd';
import {
  FileWordOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const ACCEPTED_TYPES = '.docx,.doc,.txt,.html,.htm,.rtf,.odt';
const FORMAT_LABELS: Record<string, { label: string; color: string }> = {
  docx: { label: 'DOCX', color: '#2b579a' },
  doc: { label: 'DOC', color: '#2b579a' },
  txt: { label: 'TXT', color: '#595959' },
  html: { label: 'HTML', color: '#e44d26' },
  htm: { label: 'HTML', color: '#e44d26' },
  rtf: { label: 'RTF', color: '#722ed1' },
  odt: { label: 'ODT', color: '#00a933' },
};

const getExt = (name: string) => name.split('.').pop()?.toLowerCase() || '';

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
 * Document → PDF — Accepts DOCX, TXT, HTML, RTF, ODT
 */
const WordToPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = (f: File) => {
    const ext = getExt(f.name);
    if (!Object.keys(FORMAT_LABELS).includes(ext)) {
      message.error(`Unsupported format ".${ext}". Supported: DOCX, TXT, HTML, RTF, ODT`);
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

  const convertDocx = async (arrayBuffer: ArrayBuffer) => {
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  };

  const convertOdt = async (arrayBuffer: ArrayBuffer) => {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const contentXml = await zip.file('content.xml')?.async('string');
    if (!contentXml) throw new Error('Invalid ODT file');
    return contentXml
      .replace(/<text:p[^>]*>/g, '<p>')
      .replace(/<\/text:p>/g, '</p>')
      .replace(/<text:span[^>]*>/g, '')
      .replace(/<\/text:span>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n');
  };

  const convertRtf = async (text: string) => {
    return text
      .replace(/\{\\[^{}]+\}/g, '')
      .replace(/\/[a-z]+\d*\s?/gi, '')
      .replace(/[{}]/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
  };

  const htmlToBlocks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: { text: string; bold: boolean; fontSize: number }[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          const parent = node.parentElement;
          const isHeading = parent?.tagName?.match(/^H[1-6]$/);
          const isBold =
            parent?.tagName === 'STRONG' ||
            parent?.tagName === 'B' ||
            parent?.closest('strong,b') !== null;
          const headingLevel = isHeading ? parseInt(parent!.tagName[1]) : 0;
          const fontSize = headingLevel ? Math.max(24 - headingLevel * 2, 14) : 12;
          blocks.push({ text: sanitizeForPdf(text), bold: isBold || !!isHeading, fontSize });
        }
      }
      node.childNodes.forEach(walk);
    };
    walk(doc.body);
    return blocks;
  };

  const textToBlocks = (text: string) => {
    return text.split('\n').map((line) => ({
      text: sanitizeForPdf(line) || ' ',
      bold: false,
      fontSize: 12,
    }));
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(10);
    try {
      const ext = getExt(file.name);
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      let blocks: { text: string; bold: boolean; fontSize: number }[] = [];

      setProgress(30);

      if (ext === 'docx' || ext === 'doc') {
        const ab = await file.arrayBuffer();
        const html = await convertDocx(ab);
        blocks = htmlToBlocks(html);
      } else if (ext === 'html' || ext === 'htm') {
        const text = await file.text();
        blocks = htmlToBlocks(text);
      } else if (ext === 'txt') {
        const text = await file.text();
        blocks = textToBlocks(text);
      } else if (ext === 'rtf') {
        const raw = await file.text();
        const plain = await convertRtf(raw);
        blocks = textToBlocks(plain);
      } else if (ext === 'odt') {
        const ab = await file.arrayBuffer();
        const text = await convertOdt(ab);
        blocks = textToBlocks(text);
      }

      setProgress(60);

      // Build PDF
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const maxWidth = pageWidth - margin * 2;
      let currentY = pageHeight - margin;
      let page = pdfDoc.addPage([pageWidth, pageHeight]);

      for (const block of blocks) {
        const usedFont = block.bold ? fontBold : font;
        const lineHeight = block.fontSize * 1.4;
        const words = block.text.split(' ');
        let line = '';
        const lines: string[] = [];
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          const w = usedFont.widthOfTextAtSize(test, block.fontSize);
          if (w > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);

        for (const ln of lines) {
          if (currentY < margin + lineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }
          page.drawText(ln, {
            x: margin,
            y: currentY,
            size: block.fontSize,
            font: usedFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentY -= lineHeight;
        }
        currentY -= block.fontSize * 0.4;
      }

      setProgress(90);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setProgress(100);
      message.success('Conversion complete!');
    } catch (err) {
      console.error(err);
      message.error('Failed to convert document to PDF.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, '') || 'document') + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const ext = file ? getExt(file.name) : '';
  const formatInfo = ext ? FORMAT_LABELS[ext] : null;

  return (
    <>
      <div className="dropZone" onClick={() => document.getElementById('doc-upload')?.click()}>
        <Upload
          id="doc-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept={ACCEPTED_TYPES}
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FileWordOutlined className="dropZoneIcon" />
        <span className="dropZoneText">
          {file ? file.name : 'Drop or click to upload document'}
        </span>
        <span className="dropZoneHint">Supports: DOCX, DOC, TXT, HTML, RTF, ODT</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FileWordOutlined className="fileItemIcon" />
            <div className="fileItemInfo">
              <div className="fileItemName">{file.name}</div>
              <div className="fileItemSize">
                {(file.size / 1024).toFixed(1)} KB
                {formatInfo && (
                  <Tag color={formatInfo.color} style={{ marginLeft: 8, fontSize: 10 }}>
                    {formatInfo.label}
                  </Tag>
                )}
              </div>
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
          <Spin tip="Parsing document blocks, parsing HTML/RTF layouts and writing PDF streams..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#2f54eb" />
        </div>
      )}

      <Space>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={convert}
          loading={loading}
          disabled={!file}
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

export default WordToPdf;
