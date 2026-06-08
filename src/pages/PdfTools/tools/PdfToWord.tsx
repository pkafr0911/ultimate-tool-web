import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Select, Tag, Spin } from 'antd';
import {
  FilePdfOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import FilePreview from './FilePreview';

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
  fontFamily: string;
}

type DocBlock =
  | { type: 'heading'; text: string; level: number; bold: boolean; fontSize: number; fontFamily: string }
  | { type: 'paragraph'; text: string; bold: boolean; italic: boolean; fontSize: number; fontFamily: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'image'; dataUrl: string; width: number; height: number; imgId: string };

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

      // Helper to multiply 2D affine matrices
      const multiplyMatrices = (m1: number[], m2: number[]) => {
        return [
          m1[0] * m2[0] + m1[2] * m2[1],
          m1[1] * m2[0] + m1[3] * m2[1],
          m1[0] * m2[2] + m1[2] * m2[3],
          m1[1] * m2[2] + m1[3] * m2[3],
          m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
          m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
        ];
      };

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const operatorList = await page.getOperatorList();

        // 1. Extract Images by tracking Current Transformation Matrix (CTM)
        const extractedImages: {
          x: number;
          y: number;
          width: number;
          height: number;
          dataUrl: string;
        }[] = [];

        let ctm = [1, 0, 0, 1, 0, 0];
        const ctmStack: number[][] = [];

        for (let j = 0; j < operatorList.fnArray.length; j++) {
          const fn = operatorList.fnArray[j];
          const args = operatorList.argsArray[j];

          if (fn === pdfjsLib.OPS.transform) {
            ctm = multiplyMatrices(ctm, args);
          } else if (fn === pdfjsLib.OPS.save) {
            ctmStack.push([...ctm]);
          } else if (fn === pdfjsLib.OPS.restore) {
            if (ctmStack.length > 0) {
              ctm = ctmStack.pop()!;
            }
          } else if (
            fn === pdfjsLib.OPS.paintImageXObject ||
            fn === pdfjsLib.OPS.paintInlineImageXObject
          ) {
            let imgObj: any = null;
            if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
              imgObj = args[0];
            } else {
              const imgName = args[0];
              try {
                imgObj = page.objs.get(imgName) || page.commonObjs.get(imgName);
              } catch (e) {
                console.warn('Failed to retrieve image object:', imgName, e);
              }
            }

            if (imgObj && imgObj.width && imgObj.height) {
              const width = Math.abs(ctm[0]);
              const height = Math.abs(ctm[3]);
              const x = ctm[4];
              const y = ctm[5];

              // Render raw PDF image data onto canvas
              const canvas = document.createElement('canvas');
              canvas.width = imgObj.width;
              canvas.height = imgObj.height;
              const ctx = canvas.getContext('2d');

              if (ctx) {
                const rgbaData = new Uint8ClampedArray(imgObj.width * imgObj.height * 4);
                const data = imgObj.data;

                if (data) {
                  if (data.length === imgObj.width * imgObj.height * 3) {
                    // RGB format
                    for (let k = 0, l = 0; k < data.length; k += 3, l += 4) {
                      rgbaData[l] = data[k];
                      rgbaData[l + 1] = data[k + 1];
                      rgbaData[l + 2] = data[k + 2];
                      rgbaData[l + 3] = 255;
                    }
                  } else if (data.length === imgObj.width * imgObj.height * 4) {
                    // RGBA format
                    rgbaData.set(data);
                  } else {
                    // Grayscale or other formats
                    for (let k = 0, l = 0; k < data.length; k++, l += 4) {
                      rgbaData[l] = data[k];
                      rgbaData[l + 1] = data[k];
                      rgbaData[l + 2] = data[k];
                      rgbaData[l + 3] = 255;
                    }
                  }

                  const imgDataObj = new ImageData(rgbaData, imgObj.width, imgObj.height);
                  ctx.putImageData(imgDataObj, 0, 0);

                  try {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    extractedImages.push({
                      x,
                      y,
                      width,
                      height,
                      dataUrl,
                    });
                  } catch (e) {
                    console.error('Failed to encode image to data URL:', e);
                  }
                }
              }
            }
          }
        }

        // 2. Extract Text Items and map styles
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

          // Retrieve font family
          let fontFamily = 'Arial';
          if (t.fontName && textContent.styles[t.fontName]) {
            const rawFamily = textContent.styles[t.fontName].fontFamily;
            if (rawFamily) {
              fontFamily = rawFamily.replace(/,.*?$/, '').trim();
            }
          }

          lineMap.get(y)!.push({
            x: t.transform[4],
            str: t.str ?? '',
            width: t.width ?? 0,
            bold,
            italic,
            fontSize,
            fontFamily,
          });
        }

        // 3. Combine Text Lines and Images into sorted flow
        const textLines: { y: number; items: TextItem[] }[] = [];
        for (const [y, items] of lineMap.entries()) {
          items.sort((a, b) => a.x - b.x);
          if (items.length > 0) {
            textLines.push({ y, items });
          }
        }

        type PageElement =
          | { type: 'text'; y: number; items: TextItem[] }
          | { type: 'image'; y: number; dataUrl: string; width: number; height: number };

        const pageElements: PageElement[] = [];

        for (const line of textLines) {
          pageElements.push({
            type: 'text',
            y: line.y,
            items: line.items,
          });
        }

        for (const img of extractedImages) {
          pageElements.push({
            type: 'image',
            y: img.y + img.height, // Sort by top boundary
            dataUrl: img.dataUrl,
            width: img.width,
            height: img.height,
          });
        }

        // Sort elements top-to-bottom
        pageElements.sort((a, b) => b.y - a.y);

        // 4. Classify and reconstruct into document blocks (tables, paragraphs, headings, images)
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

        for (const element of pageElements) {
          if (element.type === 'image') {
            flushTable();
            blocks.push({
              type: 'image',
              dataUrl: element.dataUrl,
              width: element.width,
              height: element.height,
              imgId: Math.random().toString(36).substring(2, 11),
            });
          } else {
            const items = element.items;
            const cells: string[] = [];
            let currentCell = '';
            let prevEnd = -Infinity;

            for (const item of items) {
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
            const firstFontFamily = items[0]?.fontFamily || 'Arial';

            // Classify multi-cell rows as tables
            if (filledCells.length >= 2 && items.length >= 2) {
              currentTableRows.push(cells);
            } else {
              flushTable();

              let lineText = '';
              let prevTextEnd = -Infinity;
              for (const item of items) {
                if (prevTextEnd !== -Infinity && item.x - prevTextEnd > 2) {
                  lineText += ' ';
                }
                lineText += item.str;
                prevTextEnd = item.x + item.width;
              }

              const trimmed = lineText.trim();
              if (!trimmed) continue;

              if (maxFontSize > 14) {
                blocks.push({
                  type: 'heading',
                  text: trimmed,
                  level: maxFontSize > 20 ? 1 : 2,
                  bold: hasBold || maxFontSize > 16,
                  fontSize: maxFontSize,
                  fontFamily: firstFontFamily,
                });
              } else {
                blocks.push({
                  type: 'paragraph',
                  text: trimmed,
                  bold: hasBold,
                  italic: hasItalic,
                  fontSize: maxFontSize,
                  fontFamily: firstFontFamily,
                });
              }
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
                if (b.type === 'image') {
                  return `[Image: ${b.width.toFixed(0)}x${b.height.toFixed(0)}]`;
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
            const fontStyle = `font-family: "${b.fontFamily}", sans-serif;`;
            return `<${tag} class="heading-${b.level}" style="${fontStyle}">${b.text}</${tag}>`;
          } else if (b.type === 'table') {
            const rowsHtml = b.rows
              .map((row, rIdx) => {
                const cellTag = rIdx === 0 ? 'th' : 'td';
                const cellsHtml = row.map((cell) => `<${cellTag}>${cell}</${cellTag}>`).join('');
                return `<tr>${cellsHtml}</tr>`;
              })
              .join('\n');
            return `<table>${rowsHtml}</table>`;
          } else if (b.type === 'image') {
            return `<div style="text-align: center; margin: 16px 0;"><img src="${b.dataUrl}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 4px;" alt="Extracted Image" /></div>`;
          } else {
            const boldStyle = b.bold ? 'font-weight:bold;' : '';
            const italicStyle = b.italic ? 'font-style:italic;' : '';
            const fontStyle = `font-family: "${b.fontFamily}", sans-serif; font-size: ${b.fontSize}px;`;
            const style = ` style="${boldStyle}${italicStyle}${fontStyle}"`;
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
        } else if (b.type === 'image') {
          return `\\par\\pard [Image: ${b.width.toFixed(0)}x${b.height.toFixed(0)}]\\par`;
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
                } else if (b.type === 'image') {
                  return `<text:p text:style-name="TextBody">[Image: ${b.width.toFixed(0)}x${b.height.toFixed(0)}]</text:p>`;
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
        // Docx Word 2003 XML generation with VML support
        const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument 
  xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:sl="http://schemas.microsoft.com/schemaLibrary/2003/core">
<w:body>
${pages!
  .map((p, i) => {
    const pageHeader = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:color w:val="1d39c4"/><w:sz w:val="28"/><w:b/></w:rPr><w:t>Page ${i + 1}</w:t></w:r></w:p>`;

    const blocksDocx = p.blocks
      .map((b) => {
        if (b.type === 'heading') {
          const sz = Math.round(b.fontSize * 2);
          const fontFamily = b.fontFamily || 'Arial';
          return `<w:p><w:pPr><w:pStyle w:val="Heading${b.level}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}"/><w:sz w:val="${sz}"/><w:b/></w:rPr><w:t>${b.text
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
                  <w:rPr>
                    <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
                    <w:sz w:val="20"/>
                  </w:rPr>
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
        } else if (b.type === 'image') {
          let w = b.width;
          let h = b.height;
          const maxPageWidth = 468; // pt (Word standard margins)
          if (w > maxPageWidth) {
            h = (maxPageWidth / w) * h;
            w = maxPageWidth;
          }
          const base64Data = b.dataUrl.split(',')[1];
          const imgName = `wordml://image_${b.imgId}.jpg`;

          return `<w:p>
            <w:pPr>
              <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
              <w:pict>
                <w:binData w:name="${imgName}">
${base64Data}
                </w:binData>
                <v:shape id="img_${b.imgId}" style="width:${w.toFixed(1)}pt;height:${h.toFixed(1)}pt">
                  <v:imagedata src="${imgName}"/>
                </v:shape>
              </w:pict>
            </w:r>
          </w:p>`;
        } else {
          const sz = Math.round(b.fontSize * 2);
          const fontFamily = b.fontFamily || 'Arial';
          const boldPr = b.bold ? '<w:b/>' : '';
          const italicPr = b.italic ? '<w:i/>' : '';
          const runPr = `<w:rPr><w:rFonts w:ascii="${fontFamily}" w:hAnsi="${fontFamily}"/><w:sz w:val="${sz}"/>${boldPr}${italicPr}</w:rPr>`;
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

      {file && <FilePreview file={file} type="source" />}

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

      {resultBlob && (
        <FilePreview
          blob={resultBlob}
          fileName={(file?.name.replace(/\.pdf$/, '') || 'document') + '.' + outputFormat}
          type="result"
        />
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
