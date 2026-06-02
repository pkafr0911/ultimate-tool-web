import React, { useState, useEffect } from 'react';
import { Button, Upload, message, Progress, Space, Select } from 'antd';
import {
  PictureOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';

interface ToolProps {
  droppedFile?: File | File[] | null;
  clearDroppedFile?: () => void;
}

/**
 * Image → PDF — Convert images to a PDF document
 */
const ImageToPdf: React.FC<ToolProps> = ({ droppedFile, clearDroppedFile }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');

  const handleFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(
      (f) => f.type.startsWith('image/') || f.name.endsWith('.svg'),
    );
    if (imageFiles.length === 0) {
      message.error('Please upload image files (PNG, JPG, WEBP, SVG).');
      return;
    }
    setFiles((prev) => [...prev, ...imageFiles]);

    imageFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(f);
    });
    setResultBlob(null);
    setProgress(0);
  };

  useEffect(() => {
    if (droppedFile) {
      const list = Array.isArray(droppedFile) ? droppedFile : [droppedFile];
      handleFiles(list);
      clearDroppedFile?.();
    }
  }, [droppedFile]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setResultBlob(null);
  };

  const convert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setProgress(10);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      const pageSizes: Record<string, [number, number]> = {
        a4: [595.28, 841.89],
        letter: [612, 792],
        fit: [0, 0],
      };

      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const type = files[i].type;
        const isSvg = files[i].name.endsWith('.svg') || type === 'image/svg+xml';

        let image;
        if (!isSvg && type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else if (!isSvg && (type === 'image/jpeg' || type === 'image/jpg')) {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          let imgEl: HTMLImageElement;
          if (isSvg) {
            const svgText = await files[i].text();
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = svgUrl;
            });
            URL.revokeObjectURL(svgUrl);
          } else {
            const bitmap = await createImageBitmap(files[i]);
            imgEl = document.createElement('img') as any;
            (imgEl as any) = bitmap;
          }
          const w = isSvg ? imgEl.naturalWidth || 800 : (imgEl as any).width;
          const h = isSvg ? imgEl.naturalHeight || 600 : (imgEl as any).height;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(imgEl as any, 0, 0, w, h);
          const pngBlob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), 'image/png'),
          );
          const pngBuffer = await pngBlob.arrayBuffer();
          image = await pdfDoc.embedPng(pngBuffer);
        }

        const imgWidth = image.width;
        const imgHeight = image.height;

        let [pw, ph] = pageSizes[pageSize];
        if (pageSize === 'fit') {
          pw = imgWidth;
          ph = imgHeight;
        }

        const page = pdfDoc.addPage([pw, ph]);

        const margin = pageSize === 'fit' ? 0 : 30;
        const maxW = pw - margin * 2;
        const maxH = ph - margin * 2;
        const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
        const drawW = imgWidth * scale;
        const drawH = imgHeight * scale;

        page.drawImage(image, {
          x: (pw - drawW) / 2,
          y: (ph - drawH) / 2,
          width: drawW,
          height: drawH,
        });

        setProgress(10 + Math.round(((i + 1) / files.length) * 80));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultBlob(blob);
      setProgress(100);
      message.success(`Successfully converted ${files.length} images to PDF!`);
    } catch (err) {
      console.error(err);
      message.error('Failed to convert images to PDF.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="dropZone"
        onClick={() => document.getElementById('img-pdf-upload')?.click()}
      >
        <Upload
          id="img-pdf-upload"
          beforeUpload={(f, fileList) => {
            handleFiles(fileList as any as File[]);
            return false;
          }}
          showUploadList={false}
          accept="image/*,.svg"
          multiple
        >
          <div style={{ display: 'none' }} />
        </Upload>
        <PictureOutlined className="dropZoneIcon" />
        <span className="dropZoneText">Drop or click to add images</span>
        <span className="dropZoneHint">PNG, JPG, WEBP, SVG — each image becomes one PDF page</span>
      </div>

      {previews.length > 0 && (
        <div className="thumbnailGrid" style={{ margin: '16px 0' }}>
          {previews.map((src, idx) => (
            <div key={idx} className="thumbnail" onClick={() => removeFile(idx)}>
              <img
                src={src}
                alt={files[idx]?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div className="thumbnailLabel">{files[idx]?.name?.slice(0, 20)}</div>
            </div>
          ))}
        </div>
      )}

      {progress > 0 && progress < 100 && (
        <div className="progressArea" style={{ marginTop: 16 }}>
          <Progress percent={progress} status="active" strokeColor="#2f54eb" />
        </div>
      )}

      {files.length > 0 && (
        <div className="settingsRow" style={{ marginTop: 16 }}>
          <label>Page size:</label>
          <Select
            value={pageSize}
            onChange={setPageSize}
            options={[
              { label: 'A4', value: 'a4' },
              { label: 'Letter', value: 'letter' },
              { label: 'Fit to image', value: 'fit' },
            ]}
            style={{ width: 140 }}
          />
        </div>
      )}

      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={convert}
          loading={loading}
          disabled={files.length === 0}
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
        {files.length > 0 && (
          <Button
            danger
            onClick={() => {
              setFiles([]);
              setPreviews([]);
              setResultBlob(null);
            }}
          >
            Clear All
          </Button>
        )}
      </Space>
    </>
  );
};

export default ImageToPdf;
