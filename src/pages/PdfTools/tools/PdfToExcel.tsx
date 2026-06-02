import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Select, Tag, Spin } from 'antd';
import {
  FilePdfOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

type OutputFormat = 'xlsx' | 'ods' | 'csv';

const OUTPUT_FORMATS: {
  label: string;
  value: OutputFormat;
  color: string;
  mime: string;
  bookType: any;
}[] = [
  {
    label: 'Excel (.xlsx)',
    value: 'xlsx',
    color: '#217346',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    bookType: 'xlsx',
  },
  {
    label: 'ODS (.ods)',
    value: 'ods',
    color: '#00a933',
    mime: 'application/vnd.oasis.opendocument.spreadsheet',
    bookType: 'ods',
  },
  { label: 'CSV (.csv)', value: 'csv', color: '#595959', mime: 'text/csv', bookType: 'csv' },
];

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * PDF → Excel — Extract tabular data from PDF to XLSX / ODS / CSV
 */
const PdfToExcel: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('xlsx');

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf')) {
      message.error('Please upload a PDF file.');
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
    setLoadingFile(true);
    setProgress(10);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const XLSX = await import('xlsx');

      setProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const workbook = XLSX.utils.book_new();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // 1. Gather all items
        const rawItems: { x: number; y: number; text: string }[] = [];
        for (const item of textContent.items) {
          const t = item as any;
          if (!t.str?.trim()) continue;
          rawItems.push({
            x: t.transform[4],
            y: Math.round(t.transform[5] * 2) / 2,
            text: t.str.trim()
          });
        }

        if (rawItems.length === 0) continue;

        // 2. Identify distinct column coordinates (X-clustering)
        const xCoords = rawItems.map(it => it.x).sort((a, b) => a - b);
        const columnCentroids: number[] = [];
        const clusterThreshold = 18; // Align cells within 18px to the same column
        
        for (const x of xCoords) {
          let found = false;
          for (let cIdx = 0; cIdx < columnCentroids.length; cIdx++) {
            if (Math.abs(columnCentroids[cIdx] - x) < clusterThreshold) {
              columnCentroids[cIdx] = (columnCentroids[cIdx] + x) / 2;
              found = true;
              break;
            }
          }
          if (!found) {
            columnCentroids.push(x);
          }
        }
        columnCentroids.sort((a, b) => a - b);
        const colCount = columnCentroids.length;

        // 3. Group items into rows (Y-clustering)
        const rowMap = new Map<number, { x: number; text: string }[]>();
        for (const item of rawItems) {
          const yKey = Math.round(item.y / 3.5) * 3.5;
          if (!rowMap.has(yKey)) {
            rowMap.set(yKey, []);
          }
          rowMap.get(yKey)!.push({ x: item.x, text: item.text });
        }

        // 4. Place items into correct columns
        const sortedYKeys = Array.from(rowMap.keys()).sort((a, b) => b - a);
        const sheetData: string[][] = [];

        for (const y of sortedYKeys) {
          const rowItems = rowMap.get(y)!;
          const rowData = new Array(colCount).fill('');
          
          for (const item of rowItems) {
            let closestIdx = 0;
            let minDiff = Infinity;
            for (let cIdx = 0; cIdx < colCount; cIdx++) {
              const diff = Math.abs(columnCentroids[cIdx] - item.x);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = cIdx;
              }
            }
            rowData[closestIdx] = rowData[closestIdx] 
              ? `${rowData[closestIdx]} ${item.text}` 
              : item.text;
          }
          sheetData.push(rowData);
        }

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, ws, `Page ${i}`);
        setProgress(20 + Math.round((i / pdf.numPages) * 65));
      }

      setProgress(90);
      const fmt = OUTPUT_FORMATS.find((f) => f.value === outputFormat)!;
      const outData = XLSX.write(workbook, { bookType: fmt.bookType, type: 'array' });
      const blob = new Blob([outData], { type: fmt.mime });
      setResultBlob(blob);
      setProgress(100);
      message.success(`PDF tables successfully extracted to ${fmt.value.toUpperCase()}!`);
    } catch (err) {
      console.error(err);
      message.error('Failed to convert PDF to Excel.');
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
    a.download = (file?.name.replace(/\.pdf$/, '') || 'spreadsheet') + '.' + outputFormat;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('pdf-excel-upload')?.click()}
      >
        <Upload
          id="pdf-excel-upload"
          beforeUpload={(f) => {
            handleFile(f);
            return false;
          }}
          showUploadList={false}
          accept=".pdf"
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <FilePdfOutlined className="dropZoneIcon" />
        <span className="dropZoneText">{file ? file.name : 'Drop or click to upload PDF'}</span>
        <span className="dropZoneHint">Extract tables and text data to XLSX, ODS, or CSV</span>
      </div>

      {file && (
        <div className="fileList">
          <div className="fileItem">
            <FilePdfOutlined className="fileItemIcon" />
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

      {file && (
        <div className="settingsRow">
          <label>Output format:</label>
          <Select
            value={outputFormat}
            onChange={(v) => {
              setOutputFormat(v);
              setResultBlob(null);
            }}
            style={{ width: 180 }}
            options={OUTPUT_FORMATS.map((f) => ({
              label: (
                <span>
                  <Tag color={f.color} style={{ fontSize: 10 }}>
                    {f.value.toUpperCase()}
                  </Tag>
                  {f.label}
                </span>
              ),
              value: f.value,
            }))}
          />
        </div>
      )}

      {loadingFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
          <Spin tip="Analyzing layout and extracting tables from PDF pages..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#217346" />
        </div>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={convert}
          loading={loading}
          disabled={!file || loadingFile}
          style={{ background: '#217346', borderColor: '#217346' }}
        >
          Convert to{' '}
          {OUTPUT_FORMATS.find((f) => f.value === outputFormat)
            ?.label.split('(')[0]
            .trim()}
        </Button>
        {resultBlob && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={download}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Download {outputFormat.toUpperCase()}
          </Button>
        )}
      </Space>
    </>
  );
};

export default PdfToExcel;
