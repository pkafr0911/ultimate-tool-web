import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Select, Tag, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons';

type OutputFormat = 'docx' | 'txt' | 'html' | 'rtf' | 'odt';

const OUTPUT_FORMATS: { label: string; value: OutputFormat; color: string }[] = [
  { label: 'Word (.docx)', value: 'docx', color: '#2b579a' },
  { label: 'Text (.txt)', value: 'txt', color: '#595959' },
  { label: 'HTML (.html)', value: 'html', color: '#e44d26' },
  { label: 'RTF (.rtf)', value: 'rtf', color: '#722ed1' },
  { label: 'ODT (.odt)', value: 'odt', color: '#00a933' },
];

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

interface TextItem {
  x: number;
  str: string;
  width: number;
  bold: boolean;
  italic: boolean;
  fontSize: number;
}

type DocBlock =
  | { type: 'heading'; text: string; level: number; bold: boolean; fontSize: number }
  | { type: 'paragraph'; text: string; bold: boolean; italic: boolean; fontSize: number }
  | { type: 'table'; rows: string[][] };

interface PageData {
  blocks: DocBlock[];
}

/**
 * PDF → Document — Export PDF to DOCX, TXT, HTML, RTF, ODT with layout, table, and style reconstruction
 */
const PdfToWord: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('docx');

  const handleFile = async (f: File) => {
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

  const extractStructuredContent = async (): Promise<PageData[] | undefined> => {
    if (!file) return;
    setLoadingFile(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: PageData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const lineMap = new Map<number, TextItem[]>();
        for (const item of textContent.items) {
          const t = item as any;
          const y = Math.round(t.transform[5] * 2) / 2;
          if (!lineMap.has(y)) lineMap.set(y, []);

          const fontName = (t.fontName || '').toLowerCase();
          const bold =
            fontName.includes('bold') ||
            fontName.includes('heavy') ||
            fontName.includes('black') ||
            fontName.includes('g_d');
          const italic = fontName.includes('italic') || fontName.includes('oblique');
          const fontSize = Math.abs(t.transform[3] || 10);

          lineMap.get(y)!.push({
            x: t.transform[4],
            str: t.str ?? '',
            width: t.width ?? 0,
            bold,
            italic,
            fontSize,
          });
        }

        // Sort lines top-to-bottom (descending Y)
        const sortedLines = Array.from(lineMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([, items]) => {
            // Sort items inside each line left-to-right
            items.sort((a, b) => a.x - b.x);
            return items;
          })
          .filter((items) => items.length > 0);

        const classifiedLines: {
          type: 'table' | 'text';
          cellsOrText: string[] | TextItem[];
          fontSize: number;
          bold: boolean;
          italic: boolean;
        }[] = [];

        for (const items of sortedLines) {
          // Detect table row: large gaps between elements on the same Y line
          const cells: string[] = [];
          let currentCell = '';
          let prevEnd = -Infinity;

          for (const item of items) {
            // If the horizontal gap is larger than 25px, separate into column cells
            if (prevEnd !== -Infinity && item.x - prevEnd > 25) {
              cells.push(currentCell.trim());
              currentCell = '';
            }
            currentCell += (currentCell ? ' ' : '') + item.str;
            prevEnd = item.x + item.width;
          }
          if (currentCell) cells.push(currentCell.trim());

          const filledCells = cells.filter(Boolean);
          const maxFontSize = Math.max(...items.map((it) => it.fontSize));
          const hasBold = items.some((it) => it.bold);
          const hasItalic = items.some((it) => it.italic);

          // If a line is split into 2+ cells with gaps, treat it as a table row
          if (filledCells.length >= 2 && items.length >= 2) {
            classifiedLines.push({
              type: 'table',
              cellsOrText: cells,
              fontSize: maxFontSize,
              bold: hasBold,
              italic: hasItalic,
            });
          } else {
            classifiedLines.push({
              type: 'text',
              cellsOrText: items,
              fontSize: maxFontSize,
              bold: hasBold,
              italic: hasItalic,
            });
          }
        }

        // Coalesce consecutive table rows into single table blocks
        const blocks: DocBlock[] = [];
        let currentTableRows: string[][] = [];

        const flushTable = () => {
          if (currentTableRows.length > 0) {
            const maxCols = Math.max(...currentTableRows.map((r) => r.length));
            const normalized = currentTableRows.map((row) => {
              while (row.length < maxCols) row.push('');
              return row;
            });
            blocks.push({ type: 'table', rows: normalized });
            currentTableRows = [];
          }
        };

        for (const line of classifiedLines) {
          if (line.type === 'table') {
            currentTableRows.push(line.cellsOrText as string[]);
          } else {
            flushTable();

            const items = line.cellsOrText as TextItem[];
            let lineText = '';
            let prevEnd = -Infinity;
            for (const item of items) {
              if (prevEnd !== -Infinity && item.x - prevEnd > 2) {
                lineText += ' ';
              }
              lineText += item.str;
              prevEnd = item.x + item.width;
            }

            const trimmed = lineText.trim();
            if (!trimmed) continue;

            if (line.fontSize > 14) {
              blocks.push({
                type: 'heading',
                text: trimmed,
                level: line.fontSize > 20 ? 1 : 2,
                bold: line.bold || line.fontSize > 16,
                fontSize: line.fontSize,
              });
            } else {
              blocks.push({
                type: 'paragraph',
                text: trimmed,
                bold: line.bold,
                italic: line.italic,
                fontSize: line.fontSize,
              });
            }
          }
        }
        flushTable();

        pages.push({ blocks });
        setProgress(20 + Math.round((i / pdf.numPages) * 50));
      }
      return pages;
    } catch (err) {
      console.error(err);
      message.error('Failed to parse PDF structures.');
    } finally {
      setLoadingFile(false);
    }
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(10);
    try {
      const pages = await extractStructuredContent();
      if (!pages) throw new Error('Failed to extract document contents.');
      setProgress(75);

      let blob: Blob;
      let ext: string;

      if (outputFormat === 'txt') {
        const text = pages
          .map((p, i) => {
            const pageHeader = `--- Page ${i + 1} ---\n`;
            const content = p.blocks
              .map((b) => {
                if (b.type === 'table') {
                  return b.rows.map((row) => row.join('\t')).join('\n');
                }
                return b.text;
              })
              .join('\n\n');
            return pageHeader + content;
          })
          .join('\n\n');
        blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        ext = 'txt';
      } else if (outputFormat === 'html') {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${file.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; line-height: 1.6; color: #333; }
    h1 { color: #1f1f1f; font-size: 28px; border-bottom: 2px solid #eaeaea; padding-bottom: 12px; margin-bottom: 24px; }
    h2 { color: #2f54eb; border-bottom: 1px solid #e8ecf8; padding-bottom: 8px; margin-top: 32px; }
    .page { margin-bottom: 40px; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .page-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #8c8c8c; margin-bottom: 16px; border-bottom: 1px dashed #eee; padding-bottom: 6px; }
    p { margin: 12px 0; }
    .heading-1 { font-size: 22px; font-weight: bold; margin: 20px 0 10px 0; color: #111; }
    .heading-2 { font-size: 18px; font-weight: bold; margin: 16px 0 8px 0; color: #222; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 13px; }
    th, td { border: 1px solid #d9d9d9; padding: 10px 12px; text-align: left; }
    tr:nth-child(even) { background-color: #fafafa; }
    th { background-color: #f0f5ff; font-weight: bold; color: #1d39c4; }
  </style>
</head>
<body>
  <h1>📄 ${file.name}</h1>
  ${pages
    .map((p, i) => {
      const blocksHtml = p.blocks
        .map((b) => {
          if (b.type === 'heading') {
            const tag = b.level === 1 ? 'h2' : 'h3';
            return `<${tag} class="heading-${b.level}">${b.text}</${tag}>`;
          } else if (b.type === 'table') {
            const rowsHtml = b.rows
              .map((row, rIdx) => {
                const cellTag = rIdx === 0 ? 'th' : 'td';
                const cellsHtml = row.map((cell) => `<${cellTag}>${cell}</${cellTag}>`).join('');
                return `<tr>${cellsHtml}</tr>`;
              })
              .join('\n');
            return `<table>${rowsHtml}</table>`;
          } else {
            const boldStyle = b.bold ? 'font-weight:bold;' : '';
            const italicStyle = b.italic ? 'font-style:italic;' : '';
            const style = boldStyle || italicStyle ? ` style="${boldStyle}${italicStyle}"` : '';
            return `<p${style}>${b.text}</p>`;
          }
        })
        .join('\n');

      return `<div class="page"><div class="page-title">Page ${i + 1}</div>${blocksHtml}</div>`;
    })
    .join('\n')}
</body>
</html>`;
        blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        ext = 'html';
      } else if (outputFormat === 'rtf') {
        const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;\\red47\\green84\\blue235;}
${pages
  .map((p, i) => {
    const blocksRtf = p.blocks
      .map((b) => {
        if (b.type === 'heading') {
          return `\\par\\pard\\cf2\\b\\fs${Math.round(b.fontSize * 2)} ${b.text}\\b0\\cf1\\par`;
        } else if (b.type === 'table') {
          return b.rows.map((row) => `\\par\\pard ` + row.join(' \\tab ') + `\\par`).join('\n');
        } else {
          const bPrefix = b.bold ? '\\b ' : '';
          const bSuffix = b.bold ? '\\b0 ' : '';
          const iPrefix = b.italic ? '\\i ' : '';
          const iSuffix = b.italic ? '\\i0 ' : '';
          return `\\par\\pard ${bPrefix}${iPrefix}${b.text}${iSuffix}${bSuffix}\\par`;
        }
      })
      .join('\n');
    return `\\par\\pard\\b Page ${i + 1}\\b0\\par\n${blocksRtf}\\par`;
  })
  .join('\n')}
}`;
        blob = new Blob([rtfContent], { type: 'application/rtf' });
        ext = 'rtf';
      } else if (outputFormat === 'odt') {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });
        zip.file(
          'META-INF/manifest.xml',
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`,
        );

        const paragraphs = pages
          .map((p, i) => {
            const blocksOdt = p.blocks
              .map((b) => {
                if (b.type === 'heading') {
                  return `<text:h text:style-name="Heading${b.level}">${b.text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</text:h>`;
                } else if (b.type === 'table') {
                  const rowsOdt = b.rows
                    .map((row) => {
                      const cellsOdt = row
                        .map((cell) => {
                          return `<table:table-cell office:value-type="string">
                      <text:p text:style-name="TextBody">${cell
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')}</text:p>
                    </table:table-cell>`;
                        })
                        .join('\n');
                      return `<table:table-row>${cellsOdt}</table:table-row>`;
                    })
                    .join('\n');
                  return `<table:table table:name="Table_${Math.random()
                    .toString(36)
                    .substr(2, 5)}">${rowsOdt}</table:table>`;
                } else {
                  const styleName = b.bold ? 'BoldText' : 'TextBody';
                  return `<text:p text:style-name="${styleName}">${b.text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</text:p>`;
                }
              })
              .join('\n');

            return `<text:h text:style-name="HeadingPage">Page ${i + 1}</text:h>\n${blocksOdt}`;
          })
          .join('\n');

        zip.file(
          'content.xml',
          `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" office:version="1.3">
<office:automatic-styles>
  <style:style style:name="HeadingPage" style:family="paragraph"><style:text-properties fo:font-size="14pt" fo:font-weight="bold" fo:color="#1d39c4"/></style:style>
  <style:style style:name="Heading1" style:family="paragraph"><style:text-properties fo:font-size="18pt" style:font-weight="bold"/></style:style>
  <style:style style:name="Heading2" style:family="paragraph"><style:text-properties fo:font-size="14pt" style:font-weight="bold"/></style:style>
  <style:style style:name="TextBody" style:family="paragraph"><style:text-properties fo:font-size="11pt"/></style:style>
  <style:style style:name="BoldText" style:family="paragraph"><style:text-properties fo:font-size="11pt" fo:font-weight="bold"/></style:style>
</office:automatic-styles>
<office:body><office:text>
${paragraphs}
</office:text></office:body></office:document-content>`,
        );
        const buf = await zip.generateAsync({ type: 'arraybuffer' });
        blob = new Blob([buf], { type: 'application/vnd.oasis.opendocument.text' });
        ext = 'odt';
      } else {
        const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
<w:body>
${pages!
  .map((p, i) => {
    const pageHeader = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:color w:val="1d39c4"/><w:sz w:val="28"/><w:b/></w:rPr><w:t>Page ${i + 1}</w:t></w:r></w:p>`;

    const blocksDocx = p.blocks
      .map((b) => {
        if (b.type === 'heading') {
          const sz = b.level === 1 ? '36' : '28';
          return `<w:p><w:pPr><w:pStyle w:val="Heading${b.level}"/></w:pPr><w:r><w:rPr><w:sz w:val="${sz}"/><w:b/></w:rPr><w:t>${b.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</w:t></w:r></w:p>`;
        } else if (b.type === 'table') {
          const rowsDocx = b.rows
            .map((row) => {
              const cellsDocx = row
                .map((cell) => {
                  return `<w:tc>
              <w:tcPr>
                <w:tcW w:w="2500" w:type="dxa"/>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:t>${cell.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t>
                </w:r>
              </w:p>
            </w:tc>`;
                })
                .join('\n');
              return `<w:tr>${cellsDocx}</w:tr>`;
            })
            .join('\n');

          return `<w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
            </w:tblBorders>
          </w:tblPr>
          ${rowsDocx}
        </w:tbl>`;
        } else {
          const boldPr = b.bold ? '<w:b/>' : '';
          const italicPr = b.italic ? '<w:i/>' : '';
          const runPr = boldPr || italicPr ? `<w:rPr>${boldPr}${italicPr}</w:rPr>` : '';
          return `<w:p><w:r>${runPr}<w:t>${b.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</w:t></w:r></w:p>`;
        }
      })
      .join('\n');

    return `${pageHeader}\n${blocksDocx}`;
  })
  .join('\n')}
</w:body>
</w:wordDocument>`;
        blob = new Blob([docxContent as any], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        ext = 'docx';
      }

      setResultBlob(blob);
      setProgress(100);
      message.success('Conversion complete!');
    } catch (err) {
      console.error(err);
      message.error('Failed to convert PDF.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const ext = outputFormat;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/, '') || 'document') + '.' + ext;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('pdf-doc-upload')?.click()}
      >
        <Upload
          id="pdf-doc-upload"
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
        <span className="dropZoneText">
          {file ? file.name : 'Drop or click to upload PDF file'}
        </span>
        <span className="dropZoneHint">Convert to Word, Text, HTML, RTF, or ODT</span>
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
                    {f.label.split('(')[0].trim()}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 0',
          }}
        >
          <Spin tip="Extracting and processing PDF text content..." />
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea">
          <Progress percent={progress} status="active" strokeColor="#2f54eb" />
        </div>
      )}

      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0',
          }}
        >
          <Spin tip="Reconstructing document layout, fonts, grids, and style nodes..." />
        </div>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<SwapOutlined />}
          onClick={convert}
          loading={loading}
          disabled={!file || loadingFile}
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
            Download
          </Button>
        )}
      </Space>
    </>
  );
};

export default PdfToWord;
