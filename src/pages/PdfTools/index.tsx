import React, { useState, useRef } from 'react';
import { Button, Space, Tag, message } from 'antd';
import {
  ArrowLeftOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  MergeCellsOutlined,
  EditOutlined,
  PictureOutlined,
  FileImageOutlined,
  UnlockOutlined,
  AppstoreOutlined,
  ScissorOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  TableOutlined,
  SortAscendingOutlined,
  FontSizeOutlined,
  CompressOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';

import WordToPdf from './tools/WordToPdf';
import PdfToWord from './tools/PdfToWord';
import ExcelToPdf from './tools/ExcelToPdf';
import PdfToExcel from './tools/PdfToExcel';
import PptxToPdf from './tools/PptxToPdf';
import PdfToPptx from './tools/PdfToPptx';
import CombinePdf from './tools/CombinePdf';
import EditPdf from './tools/EditPdf';
import ImageToPdf from './tools/ImageToPdf';
import PdfToImage from './tools/PdfToImage';
import UnlockPdf from './tools/UnlockPdf';
import DeletePdfPage from './tools/DeletePdfPage';
import SortPdfPages from './tools/SortPdfPages';
import WatermarkPdf from './tools/WatermarkPdf';
import CompressPdf from './tools/CompressPdf';
import PdfOcr from './tools/PdfOcr';

import './styles.less';

/** Tool definitions */
const tools = [
  // ─── Conversion: To PDF ────────────────────────────────────
  {
    key: 'doc-to-pdf',
    name: 'Document → PDF',
    desc: 'Convert DOCX, TXT, HTML, RTF, ODT to PDF',
    icon: <FileWordOutlined />,
    color: '#2b579a',
    component: WordToPdf,
  },
  {
    key: 'excel-to-pdf',
    name: 'Excel → PDF',
    desc: 'Convert XLSX, XLS, ODS, CSV to PDF',
    icon: <FileExcelOutlined />,
    color: '#217346',
    component: ExcelToPdf,
  },
  {
    key: 'pptx-to-pdf',
    name: 'PowerPoint → PDF',
    desc: 'Convert PPTX, PPT, ODP to PDF',
    icon: <FilePptOutlined />,
    color: '#d04423',
    component: PptxToPdf,
  },
  {
    key: 'image-to-pdf',
    name: 'Image → PDF',
    desc: 'Convert PNG, JPG, WEBP, SVG to PDF',
    icon: <PictureOutlined />,
    color: '#13C2C2',
    component: ImageToPdf,
  },

  // ─── Conversion: From PDF ──────────────────────────────────
  {
    key: 'pdf-to-doc',
    name: 'PDF → Document',
    desc: 'Export PDF to Word, TXT, HTML, RTF, ODT',
    icon: <SwapOutlined />,
    color: '#2b579a',
    component: PdfToWord,
  },
  {
    key: 'pdf-to-excel',
    name: 'PDF → Excel',
    desc: 'Extract tables from PDF to XLSX, ODS, or CSV',
    icon: <TableOutlined />,
    color: '#217346',
    component: PdfToExcel,
  },
  {
    key: 'pdf-to-pptx',
    name: 'PDF → PowerPoint',
    desc: 'Convert PDF pages to PPTX slides',
    icon: <FilePptOutlined />,
    color: '#d04423',
    component: PdfToPptx,
  },
  {
    key: 'pdf-to-image',
    name: 'PDF → Image',
    desc: 'Export PDF pages as PNG, JPEG, or WEBP images',
    icon: <FileImageOutlined />,
    color: '#FA8C16',
    component: PdfToImage,
  },

  // ─── PDF Tools ─────────────────────────────────────────────
  {
    key: 'combine-pdf',
    name: 'Combine PDF',
    desc: 'Merge multiple PDFs into a single file',
    icon: <MergeCellsOutlined />,
    color: '#E8453C',
    component: CombinePdf,
  },
  {
    key: 'edit-pdf',
    name: 'Edit PDF',
    desc: 'Add text annotations to PDF pages',
    icon: <EditOutlined />,
    color: '#722ED1',
    component: EditPdf,
  },
  {
    key: 'unlock-pdf',
    name: 'Unlock PDF',
    desc: 'Remove password protection from PDFs',
    icon: <UnlockOutlined />,
    color: '#52C41A',
    component: UnlockPdf,
  },
  {
    key: 'delete-page',
    name: 'Delete Pages',
    desc: 'Remove specific pages from a PDF',
    icon: <ScissorOutlined />,
    color: '#F5222D',
    component: DeletePdfPage,
  },
  {
    key: 'sort-pages',
    name: 'Sort Pages',
    desc: 'Drag and drop to reorder PDF pages',
    icon: <SortAscendingOutlined />,
    color: '#1890FF',
    component: SortPdfPages,
  },
  {
    key: 'watermark',
    name: 'Add Watermark',
    desc: 'Overlay text watermark on all pages',
    icon: <FontSizeOutlined />,
    color: '#EB2F96',
    component: WatermarkPdf,
  },
  {
    key: 'compress',
    name: 'Compress PDF',
    desc: 'Optimize and reduce PDF file size',
    icon: <CompressOutlined />,
    color: '#FAAD14',
    component: CompressPdf,
  },
  {
    key: 'ocr',
    name: 'PDF OCR',
    desc: 'Extract text from scanned PDFs',
    icon: <FileSearchOutlined />,
    color: '#2F54EB',
    component: PdfOcr,
  },
];

const SUPPORTED_FORMATS = [
  'PDF',
  'DOCX',
  'DOC',
  'TXT',
  'HTML',
  'RTF',
  'ODT',
  'XLSX',
  'XLS',
  'ODS',
  'CSV',
  'PPTX',
  'PPT',
  'ODP',
  'PNG',
  'JPG',
  'WEBP',
  'SVG',
];

const PdfToolsPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | File[] | null>(null);
  const dragCounter = useRef(0);

  const activeToolDef = tools.find((t) => t.key === activeTool);
  const ActiveComponent = activeToolDef?.component;

  const handleUpload = (fileOrFiles: File | File[]) => {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
    if (!file) return;

    if (activeTool) {
      setDroppedFile(fileOrFiles);
    } else {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (['docx', 'doc', 'txt', 'html', 'htm', 'rtf', 'odt'].includes(ext)) {
        setActiveTool('doc-to-pdf');
        setDroppedFile(fileOrFiles);
      } else if (['xlsx', 'xls', 'ods', 'csv'].includes(ext)) {
        setActiveTool('excel-to-pdf');
        setDroppedFile(fileOrFiles);
      } else if (['pptx', 'ppt', 'odp'].includes(ext)) {
        setActiveTool('pptx-to-pdf');
        setDroppedFile(fileOrFiles);
      } else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        setActiveTool('image-to-pdf');
        setDroppedFile(fileOrFiles);
      } else if (ext === 'pdf') {
        setActiveTool('combine-pdf');
        setDroppedFile(fileOrFiles);
      } else {
        message.warning(`Dropped file type ".${ext}" is not supported.`);
      }
    }
  };

  return (
    <DragDropWrapper
      setDragging={setDragging}
      dragCounter={dragCounter}
      handleUpload={handleUpload}
    >
      <div className="container pdfToolsPage">
        <div className="shell">
          {dragging && <DragOverlay text="Drop your file to upload" />}

          {/* ═══ Hero ═══ */}
          <div className="hero">
            <div className="heroOverlay" />
            <div className="heroRow">
              <div className="heroTitleBlock">
                <span className="heroBadge">
                  <FilePdfOutlined />
                </span>
                <div>
                  <span className="heroEyebrow">Document Lab</span>
                  <h1 className="heroTitle">PDF Tools — convert, merge, edit &amp; more</h1>
                  <p className="heroSubtitle">
                    {tools.length} powerful tools supporting {SUPPORTED_FORMATS.length} file
                    formats, all running 100% in your browser. No uploads to any server.
                  </p>
                </div>
              </div>
              <div className="heroActions">
                <span className="heroStatus">
                  <span className="heroStatusDot" />
                  {activeTool ? activeToolDef?.name : `${tools.length} Tools Available`}
                </span>
                {activeTool && (
                  <Button ghost icon={<ArrowLeftOutlined />} onClick={() => setActiveTool(null)}>
                    All Tools
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Stat Strip ═══ */}
          <div className="statStrip">
            <div className="statChip">
              <span className="statIcon">
                <AppstoreOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Tools</span>
                <span className="statValue">{tools.length}</span>
                <span className="statSub">All client-side</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <FilePdfOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Formats</span>
                <span className="statValue">{SUPPORTED_FORMATS.length} types</span>
                <span className="statSub">PDF, DOCX, XLSX, PPTX…</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <ThunderboltOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Privacy</span>
                <span className="statValue">100% Local</span>
                <span className="statSub">No server uploads</span>
              </div>
            </div>
            <div className="statChip">
              <span className="statIcon">
                <SwapOutlined />
              </span>
              <div className="statBody">
                <span className="statLabel">Supported</span>
                <span
                  className="statValue"
                  title={SUPPORTED_FORMATS.join(', ')}
                  style={{ fontSize: 12 }}
                >
                  {SUPPORTED_FORMATS.slice(0, 8).join(', ')}…
                </span>
                <span className="statSub">Full conversion support</span>
              </div>
            </div>
          </div>

          {/* ═══ Tool Grid / Active Tool ═══ */}
          {!activeTool ? (
            <div className="toolGrid">
              {tools.map((tool) => {
                const iconBg = tool.color + '18';
                const iconBorder = tool.color + '35';
                return (
                  <div key={tool.key} className="toolCard" onClick={() => setActiveTool(tool.key)}>
                    <div
                      className="toolCardIcon"
                      style={{
                        background: iconBg,
                        boxShadow: `0 0 0 1px ${iconBorder}`,
                        color: tool.color,
                      }}
                    >
                      {tool.icon}
                    </div>
                    <div className="toolCardName">{tool.name}</div>
                    <div className="toolCardDesc">{tool.desc}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="subToolPanel">
              <div className="subToolHeader">
                <span className="subToolTitle">
                  {activeToolDef?.icon} {activeToolDef?.name}
                </span>
                <Space>
                  <Tag color="blue">Client-side</Tag>
                  <Button
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setActiveTool(null);
                      setDroppedFile(null);
                    }}
                  >
                    Back to tools
                  </Button>
                </Space>
              </div>
              {ActiveComponent && (
                <ActiveComponent
                  droppedFile={droppedFile}
                  clearDroppedFile={() => setDroppedFile(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </DragDropWrapper>
  );
};

export default PdfToolsPage;
