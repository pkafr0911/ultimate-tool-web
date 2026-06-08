import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Tag, Spin } from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import FilePreview from './FilePreview';

const ACCEPTED = '.xlsx,.xls,.ods,.csv';

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
 * Excel → PDF — Convert spreadsheet files to PDF
 * Supports: XLSX, XLS, ODS, CSV
 */
const ExcelToPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sheetInfo, setSheetInfo] = useState<string>('');

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'ods', 'csv'].includes(ext || '')) {
      message.error('Please upload an Excel file (XLSX, XLS, ODS, CSV).');
      return;
    }
    setFile(f);
    setResultBlob(null);
    setProgress(0);
    setSheetInfo('');
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
      const XLSX = await import('xlsx');
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

      setProgress(25);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setSheetInfo(`${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`);

      setProgress(40);
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (let s = 0; s < workbook.SheetNames.length; s++) {
        const sheetName = workbook.SheetNames[s];
        const sheet = workbook.Sheets[sheetName];
        const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        }) as string[][];

        if (data.length === 0) continue;

        const numCols = Math.max(...data.map((r) => r.length), 1);
        const pageWidth = 841.89; // A4 landscape
        const pageHeight = 595.28;
        const margin = 30;
        const usableWidth = pageWidth - margin * 2;
        const colWidth = Math.min(usableWidth / numCols, 120);
        const rowHeight = 18;
        const fontSize = 8;
        const headerFontSize = 9;

        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let currentY = pageHeight - margin;

        page.drawText(`Sheet: ${sanitizeForPdf(sheetName)}`, {
          x: margin,
          y: currentY,
          size: 14,
          font: fontBold,
          color: rgb(0.18, 0.33, 0.92),
        });
        currentY -= 24;

        for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
          if (currentY < margin + rowHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }

          const row = data[rowIdx];
          const isHeader = rowIdx === 0;
          const usedFont = isHeader ? fontBold : font;
          const usedSize = isHeader ? headerFontSize : fontSize;

          if (isHeader) {
            page.drawRectangle({
              x: margin,
              y: currentY - rowHeight + 4,
              width: Math.min(numCols * colWidth, usableWidth),
              height: rowHeight,
              color: rgb(0.93, 0.94, 0.98),
            });
          }

          for (
            let colIdx = 0;
            colIdx < Math.min(numCols, Math.floor(usableWidth / colWidth));
            colIdx++
          ) {
            const cellText = sanitizeForPdf(String(row[colIdx] ?? '')).slice(0, 20);
            const x = margin + colIdx * colWidth + 4;
            page.drawText(cellText, {
              x,
              y: currentY - 2,
              size: usedSize,
              font: usedFont,
              color: rgb(0.1, 0.1, 0.1),
            });

            page.drawRectangle({
              x: margin + colIdx * colWidth,
              y: currentY - rowHeight + 4,
              width: colWidth,
              height: rowHeight,
              borderColor: rgb(0.8, 0.82, 0.85),
              borderWidth: 0.5,
              color: undefined,
            });
          }

          currentY -= rowHeight;
        }

        setProgress(40 + Math.round(((s + 1) / workbook.SheetNames.length) * 50));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setProgress(100);
      message.success('Spreadsheet converted successfully!');
    } catch (err) {
      console.error(err);
      message.error('Failed to convert spreadsheet to PDF.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, '') || 'spreadsheet') + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('excel-pdf-upload')?.click()}
      >
        <Upload
          id="excel-pdf-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept={ACCEPTED}
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FileExcelOutlined className="dropZoneIcon" style={{ color: '#217346' }} />
        <span className="dropZoneText">
          {file ? file.name : 'Drop or click to upload spreadsheet'}
        </span>
        <span className="dropZoneHint">Supports: XLSX, XLS, ODS, CSV</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FileExcelOutlined className="fileItemIcon" style={{ color: '#217346' }} />
            <div className="fileItemInfo">
              <div className="fileItemName">{file.name}</div>
              <div className="fileItemSize">
                {(file.size / 1024).toFixed(1)} KB
                {sheetInfo && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#8c8c8c' }}>{sheetInfo}</span>
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
                setSheetInfo('');
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
          <Spin tip="Parsing spreadsheet sheets and generating vector grid PDF..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#217346" />
        </div>
      )}

      {resultBlob && (
        <FilePreview
          blob={resultBlob}
          fileName={(file?.name.replace(/\.[^.]+$/, '') || 'spreadsheet') + '.pdf'}
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
          style={{ background: '#217346', borderColor: '#217346' }}
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

export default ExcelToPdf;
