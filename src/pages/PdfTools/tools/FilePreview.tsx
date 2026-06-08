import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spin } from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';

interface FilePreviewProps {
  /** File object (for uploaded files) */
  file?: File | null;
  /** Blob (for converted result files) */
  blob?: Blob | null;
  /** Display name when using blob */
  fileName?: string;
  /** Preview type controls header styling */
  type: 'source' | 'result';
  /** Max PDF pages to render thumbnails for (default: 8) */
  maxPages?: number;
}

/**
 * FilePreview — renders an inline preview panel for uploaded files or conversion results.
 *
 * Supported formats:
 * - PDF → page thumbnails via pdfjs-dist
 * - Images (png, jpg, webp, svg, gif) → <img> element
 * - Text-based (txt, csv, html, htm, rtf, xml, json, md) → <pre> block
 * - Office docs (docx) → HTML via mammoth
 * - XLSX/XLS/ODS → table via xlsx
 * - Unsupported → file info card
 */
const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  blob,
  fileName,
  type,
  maxPages = 8,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<React.ReactNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine effective source: either file or blob
  const effectiveFile = file || null;
  const effectiveBlob = blob || null;
  const effectiveName = file?.name || fileName || 'result';

  const getExt = useCallback((name: string) => name.split('.').pop()?.toLowerCase() || '', []);

  // Detect the MIME / extension category
  const detectCategory = useCallback(
    (name: string, mimeType?: string): string => {
      const ext = getExt(name);
      if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
      if (
        ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext) ||
        mimeType?.startsWith('image/')
      )
        return 'image';
      if (
        ['txt', 'csv', 'html', 'htm', 'rtf', 'xml', 'json', 'md', 'log'].includes(ext) ||
        mimeType?.startsWith('text/')
      )
        return 'text';
      if (['docx', 'doc'].includes(ext)) return 'docx';
      if (['xlsx', 'xls', 'ods'].includes(ext)) return 'spreadsheet';
      return 'unknown';
    },
    [getExt],
  );

  useEffect(() => {
    // Reset when input changes
    if (!effectiveFile && !effectiveBlob) {
      setPreviewContent(null);
      return;
    }

    const source = effectiveFile || effectiveBlob;
    if (!source) return;

    const mimeType = effectiveFile?.type || effectiveBlob?.type || '';
    const category = detectCategory(effectiveName, mimeType);

    const loadPreview = async () => {
      setLoading(true);
      try {
        switch (category) {
          case 'pdf':
            await renderPdf(source);
            break;
          case 'image':
            renderImage(source);
            break;
          case 'text':
            await renderText(source);
            break;
          case 'docx':
            await renderDocx(source);
            break;
          case 'spreadsheet':
            await renderSpreadsheet(source);
            break;
          default:
            renderFallback(source);
            break;
        }
      } catch (err) {
        console.warn('Preview failed:', err);
        renderFallback(source);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    // Clean up object URLs on unmount
    return () => {
      // objectURLs are cleaned up in their respective render functions
    };
  }, [effectiveFile, effectiveBlob, effectiveName]);

  // ─── PDF Preview ───────────────────────────────────────────────────
  const renderPdf = async (source: File | Blob) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await source.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const pagesToRender = Math.min(totalPages, maxPages);

    const thumbnails: string[] = [];
    for (let i = 1; i <= pagesToRender; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.8 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    setPreviewContent(
      <div>
        <div className="previewInfo">
          {totalPages} page{totalPages > 1 ? 's' : ''}
          {totalPages > pagesToRender && ` (showing first ${pagesToRender})`}
        </div>
        <div className="previewThumbnails">
          {thumbnails.map((src, idx) => (
            <div key={idx} className="previewThumb">
              <img src={src} alt={`Page ${idx + 1}`} />
              <span className="previewThumbLabel">Page {idx + 1}</span>
            </div>
          ))}
        </div>
      </div>,
    );
  };

  // ─── Image Preview ─────────────────────────────────────────────────
  const renderImage = (source: File | Blob) => {
    const url = URL.createObjectURL(source);
    setPreviewContent(
      <div className="previewImageContainer">
        <img
          src={url}
          alt={effectiveName}
          className="previewImage"
          onLoad={() => {
            // Don't revoke immediately — let the image stay visible
          }}
        />
      </div>,
    );
  };

  // ─── Text Preview ──────────────────────────────────────────────────
  const renderText = async (source: File | Blob) => {
    const text = await source.text();
    const ext = getExt(effectiveName);
    const truncated = text.length > 5000;
    const displayText = truncated ? text.slice(0, 5000) + '\n\n… (truncated)' : text;

    if (ext === 'html' || ext === 'htm') {
      setPreviewContent(
        <div className="previewTextWrap">
          <div className="previewHtmlFrame" dangerouslySetInnerHTML={{ __html: displayText }} />
        </div>,
      );
    } else {
      setPreviewContent(
        <div className="previewTextWrap">
          <pre className="previewText">{displayText}</pre>
        </div>,
      );
    }
  };

  // ─── DOCX Preview ──────────────────────────────────────────────────
  const renderDocx = async (source: File | Blob) => {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await source.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      setPreviewContent(
        <div className="previewTextWrap">
          <div className="previewHtmlFrame" dangerouslySetInnerHTML={{ __html: html }} />
        </div>,
      );
    } catch {
      renderFallback(source);
    }
  };

  // ─── Spreadsheet Preview ──────────────────────────────────────────
  const renderSpreadsheet = async (source: File | Blob) => {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await source.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheets = workbook.SheetNames.slice(0, 3); // max 3 sheets preview
      const tables = sheets.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        }) as string[][];
        const previewRows = data.slice(0, 20); // max 20 rows
        return { sheetName, rows: previewRows, totalRows: data.length };
      });

      setPreviewContent(
        <div className="previewTextWrap">
          {tables.map((t, tIdx) => (
            <div key={tIdx} style={{ marginBottom: 16 }}>
              <div className="previewInfo">
                Sheet: {t.sheetName} ({t.totalRows} rows
                {t.totalRows > 20 ? ', showing first 20' : ''})
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="previewTable">
                  <tbody>
                    {t.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => {
                          const Tag = rIdx === 0 ? 'th' : 'td';
                          return <Tag key={cIdx}>{String(cell)}</Tag>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>,
      );
    } catch {
      renderFallback(source);
    }
  };

  // ─── Fallback Preview ──────────────────────────────────────────────
  const renderFallback = (source: File | Blob) => {
    const size = source.size;
    const ext = getExt(effectiveName).toUpperCase() || 'FILE';
    setPreviewContent(
      <div className="previewFallback">
        <FileTextOutlined style={{ fontSize: 32, opacity: 0.4 }} />
        <div className="previewFallbackText">
          <strong>{ext}</strong> file — {formatSize(size)}
        </div>
        <div style={{ fontSize: 11, color: '#8c8c8c' }}>
          Preview not available for this format. Download to view.
        </div>
      </div>,
    );
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Don't render if there's nothing to preview
  if (!effectiveFile && !effectiveBlob) return null;

  const isSource = type === 'source';
  const headerIcon = isSource ? (
    <EyeOutlined />
  ) : (
    <CheckCircleOutlined />
  );
  const headerText = isSource ? 'Source Preview' : 'Result Preview';

  return (
    <div
      ref={containerRef}
      className={`previewPanel ${isSource ? 'previewPanelSource' : 'previewPanelResult'}`}
    >
      <div className="previewHeader" onClick={() => setCollapsed(!collapsed)}>
        <span className="previewHeaderTitle">
          {headerIcon} {headerText}
        </span>
        <span className="previewHeaderToggle">
          {collapsed ? <DownOutlined /> : <UpOutlined />}
        </span>
      </div>

      {!collapsed && (
        <div className="previewBody">
          {loading ? (
            <div className="previewLoading">
              <Spin tip="Generating preview…" />
            </div>
          ) : (
            previewContent
          )}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
