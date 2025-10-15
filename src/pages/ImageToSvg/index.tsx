import React, { useState, useRef } from 'react';
import {
  Upload,
  Button,
  Card,
  Typography,
  Space,
  message,
  InputNumber,
  Row,
  Col,
  Tooltip,
} from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  UploadOutlined,
  DownloadOutlined,
  CopyOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import ImageTracer from 'imagetracerjs';
import { handleCopy } from '@/helpers';

const { Title } = Typography;

const ImageToSvg: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const dragCounter = useRef(0);

  // Tracing options
  const [scale, setScale] = useState(1);
  const [ltres, setLtres] = useState(1);
  const [qtres, setQtres] = useState(1);
  const [pathomit, setPathomit] = useState(8);
  const [colorsampling, setColorsampling] = useState(2);
  const [strokewidth, setStrokewidth] = useState(1);

  const handleUpload = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setDragging(false);
    dragCounter.current = 0;
    return false; // Prevent auto-upload
  };

  const handleConvert = () => {
    if (!preview) {
      message.error('Please upload an image first.');
      return;
    }
    try {
      ImageTracer.imageToSVG(
        preview,
        (svgString) => {
          setSvgContent(svgString);
          message.success('Image converted to SVG successfully!');
        },
        { scale, ltres, qtres, pathomit, colorsampling, strokewidth },
      );
    } catch (err: any) {
      console.error(err);
      message.error('Error converting image to SVG.');
    }
  };

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file?.name.replace(/\.(jpg|jpeg|png)$/i, '.svg') || 'image.svg';
    link.click();
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setSvgContent(null);
    message.info('Image and SVG cleared.');
  };

  return (
    <PageContainer>
      {/* Full-screen drag area */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current++;
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current--;
          if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          dragCounter.current = 0;
          const files = e.dataTransfer.files;
          if (files.length > 0) handleUpload(files[0]);
        }}
        style={{ position: 'relative', minHeight: '100vh' }}
      >
        <Card title="🖼️ Image to SVG Converter" bordered={false}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Show Upload button when not dragging */}
            {!dragging && (
              <Upload beforeUpload={handleUpload} showUploadList={false} accept=".png,.jpg,.jpeg">
                <Button icon={<UploadOutlined />}>Upload Image (PNG/JPG)</Button>
              </Upload>
            )}

            {/* Full-screen Dragger overlay while dragging */}
            {dragging && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 9999,
                  background: 'rgba(0,0,0,0.1)',
                  border: '2px dashed #1890ff',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  padding: 20,
                }}
              >
                <UploadOutlined style={{ fontSize: 48, color: '#000000' }} />
                <p style={{ fontSize: 18, marginTop: 8 }}>Drop file anywhere to upload</p>
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div style={{ textAlign: 'center' }}>
                <Title level={5}>Preview:</Title>
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 6,
                    border: '1px solid #eee',
                  }}
                />
              </div>
            )}

            {/* Tracing Options */}
            <Card size="small" title="Tracing Options (Adjust before converting)">
              <Row gutter={16}>
                <Col span={4}>
                  <Tooltip title="Scale factor for the SVG output. Higher = larger SVG.">
                    <label>
                      Scale <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber
                    min={0.1}
                    step={0.1}
                    value={scale}
                    onChange={(val) => setScale(val || 1)}
                  />
                </Col>
                <Col span={4}>
                  <Tooltip title="Error threshold for line detection. Lower = more precise lines.">
                    <label>
                      ltres <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber min={0} value={ltres} onChange={(val) => setLtres(val || 1)} />
                </Col>
                <Col span={4}>
                  <Tooltip title="Error threshold for curve detection. Lower = more precise curves.">
                    <label>
                      qtres <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber min={0} value={qtres} onChange={(val) => setQtres(val || 1)} />
                </Col>
                <Col span={4}>
                  <Tooltip title="Minimum path length to keep. Higher = simpler SVG with fewer tiny paths.">
                    <label>
                      Pathomit <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber min={0} value={pathomit} onChange={(val) => setPathomit(val || 0)} />
                </Col>
                <Col span={4}>
                  <Tooltip title="Pixel sampling interval for colors. 1 = every pixel, higher = faster but less accurate colors.">
                    <label>
                      ColorSampling <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber
                    min={1}
                    value={colorsampling}
                    onChange={(val) => setColorsampling(val || 1)}
                  />
                </Col>
                <Col span={4}>
                  <Tooltip title="Stroke width in the output SVG.">
                    <label>
                      StrokeWidth <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber
                    min={0}
                    value={strokewidth}
                    onChange={(val) => setStrokewidth(val || 1)}
                  />
                </Col>
              </Row>
            </Card>

            {/* Action Buttons */}
            <Space>
              <Button type="primary" onClick={handleConvert} disabled={!file}>
                Convert to SVG
              </Button>
              <Button onClick={handleDownload} icon={<DownloadOutlined />} disabled={!svgContent}>
                Download SVG
              </Button>
              <Button
                onClick={() => {
                  if (!svgContent) return;
                  handleCopy(svgContent, 'SVG copied to clipboard!');
                }}
                icon={<CopyOutlined />}
                disabled={!svgContent}
              >
                Copy SVG
              </Button>
              <Button onClick={handleClear} danger disabled={!file && !svgContent}>
                Clear Image
              </Button>
            </Space>

            {/* SVG Viewer */}
            {svgContent && (
              <>
                <Title level={5}>SVG Output Preview:</Title>
                <div
                  style={{
                    textAlign: 'center',
                    border: '1px solid #eee',
                    borderRadius: 6,
                    padding: 12,
                    overflow: 'auto',
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: svgContent }} />
                </div>

                <Title level={5}>SVG Code:</Title>
                <pre
                  style={{
                    background: '#f7f7f7',
                    padding: 12,
                    borderRadius: 6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  {svgContent}
                </pre>
              </>
            )}
          </Space>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ImageToSvg;
