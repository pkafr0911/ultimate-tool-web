import DragDropWrapper from '@/components/DragDropWrapper';
import DragOverlay from '@/components/DragOverlay';
import { handleCopy } from '@/helpers';
import {
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  InputNumber,
  Space,
  Spin,
  Tabs,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import ImageTracer from 'imagetracerjs';
import React, { useRef, useState } from 'react';

const { Title } = Typography;
const { TabPane } = Tabs;

const PNGJPEG: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

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
    return false;
  };

  const handleConvert = () => {
    if (!preview) {
      message.error('Please upload an image first.');
      return;
    }

    setProcessing(true); // 👈 start loading animation
    try {
      ImageTracer.imageToSVG(
        preview,
        (svgString) => {
          setSvgContent(svgString);
          setProcessing(false); // 👈 stop loading
          message.success('Image converted to SVG successfully!');
        },
        { scale, ltres, qtres, pathomit, colorsampling, strokewidth },
      );
    } catch (err: any) {
      console.error(err);
      setProcessing(false); // 👈 stop loading on error
      message.error('Error converting image to SVG.');
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setSvgContent(null);
    message.info('Image and SVG cleared.');
  };

  // Generate Base64 and Data URI
  const svgBase64 = svgContent ? btoa(unescape(encodeURIComponent(svgContent))) : '';
  const svgDataURI = svgContent ? `data:image/svg+xml;base64,${svgBase64}` : '';

  return (
    <PageContainer>
      <DragDropWrapper
        setDragging={setDragging}
        dragCounter={dragCounter}
        handleUpload={handleUpload}
      >
        <Card title="🖼️ Image to SVG Converter" variant={'borderless'}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {!dragging && (
              <Upload beforeUpload={handleUpload} showUploadList={false} accept=".png,.jpg,.jpeg">
                <Button icon={<UploadOutlined />}>Upload Image (PNG/JPG)</Button>
              </Upload>
            )}

            {dragging && <DragOverlay />}

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

            {/* === PROCESSING OVERLAY === */}
            {processing && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 10000,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}
              >
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
                  tip="Converting image to SVG..."
                  size="large"
                />
              </div>
            )}

            {/* Tracing Options */}
            <Card size="small" title="Tracing Options (Adjust before converting)">
              <Space wrap size={'large'}>
                <Space size={'small'}>
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
                </Space>
                <Space size={'small'}>
                  <Tooltip title="Error threshold for line detection. Lower = more precise lines.">
                    <label>
                      ltres <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber min={0} value={ltres} onChange={(val) => setLtres(val || 1)} />
                </Space>
                <Space size={'small'}>
                  <Tooltip title="Error threshold for curve detection. Lower = more precise curves.">
                    <label>
                      qtres <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber min={0} value={qtres} onChange={(val) => setQtres(val || 1)} />
                </Space>
                <Space size={'small'}>
                  <Tooltip title="Minimum path length to keep. Higher = simpler SVG with fewer tiny paths.">
                    <label>
                      Pathomit <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </label>
                  </Tooltip>
                  <InputNumber min={0} value={pathomit} onChange={(val) => setPathomit(val || 0)} />
                </Space>
                <Space size={'small'}>
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
                </Space>
                <Space size={'small'}>
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
                </Space>
              </Space>
            </Card>

            {/* Action Buttons */}
            <Space>
              <Button type="primary" onClick={handleConvert} disabled={!file}>
                Convert to SVG
              </Button>
              <Button onClick={handleClear} danger disabled={!file && !svgContent}>
                Clear Image
              </Button>
            </Space>

            {/* Tabs for SVG formats */}
            {svgContent && (
              <Tabs defaultActiveKey="svg" type="card" style={{ marginTop: 16 }}>
                <TabPane tab="SVG" key="svg">
                  <Space style={{ marginBottom: 8 }}>
                    <Button
                      onClick={() => handleDownload(svgContent, 'image.svg')}
                      icon={<DownloadOutlined />}
                    >
                      Download
                    </Button>
                    <Button
                      onClick={() => handleCopy(svgContent, 'SVG copied!')}
                      icon={<CopyOutlined />}
                    >
                      Copy
                    </Button>
                  </Space>
                  <div
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 6,
                      padding: 12,
                      overflow: 'auto',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: svgContent }} />
                  </div>
                </TabPane>

                <TabPane tab="Base64" key="base64">
                  <Space style={{ marginBottom: 8 }}>
                    <Button
                      onClick={() => handleCopy(svgBase64, 'Base64 copied!')}
                      icon={<CopyOutlined />}
                    >
                      Copy Base64
                    </Button>
                    <Button
                      onClick={() => handleDownload(svgBase64, 'image-base64.txt')}
                      icon={<DownloadOutlined />}
                    >
                      Download Base64
                    </Button>
                  </Space>
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
                    {svgBase64}
                  </pre>
                </TabPane>

                <TabPane tab="Data URI" key="datauri">
                  <Space style={{ marginBottom: 8 }}>
                    <Button
                      onClick={() => handleCopy(svgDataURI, 'Data URI copied!')}
                      icon={<CopyOutlined />}
                    >
                      Copy Data URI
                    </Button>
                    <Button
                      onClick={() => handleDownload(svgDataURI, 'image-datauri.txt')}
                      icon={<DownloadOutlined />}
                    >
                      Download Data URI
                    </Button>
                  </Space>
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
                    {svgDataURI}
                  </pre>
                </TabPane>
              </Tabs>
            )}
          </Space>
        </Card>
      </DragDropWrapper>
    </PageContainer>
  );
};

export default PNGJPEG;
