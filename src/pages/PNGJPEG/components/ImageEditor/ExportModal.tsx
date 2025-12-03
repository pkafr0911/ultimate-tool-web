import React, { useState } from 'react';
import {
  Modal,
  Checkbox,
  Radio,
  Space,
  Tooltip,
  InputNumber,
  Button,
  Tabs,
  Spin,
  Divider,
} from 'antd';
import {
  InfoCircleOutlined,
  DownloadOutlined,
  LoadingOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { handleCopy } from '@/helpers';

type Props = {
  open: boolean;
  onCancel: () => void;
  onExportImage: (format: 'png' | 'jpg', includeOverlays: boolean) => void;
  onExportSvg: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  processing: boolean;
  svgContent: string | null;
  scale: number;
  setScale: (v: number) => void;
  ltres: number;
  setLtres: (v: number) => void;
  qtres: number;
  setQtres: (v: number) => void;
  pathomit: number;
  setPathomit: (v: number) => void;
  colorsampling: number;
  setColorsampling: (v: number) => void;
  strokewidth: number;
  setStrokewidth: (v: number) => void;
  onDownload: (content: string, filename: string) => void;
  getSvgModalWidth: () => number;
  getSvgModalHeight: () => number | undefined;
};

const ExportModal: React.FC<Props> = ({
  open,
  onCancel,
  onExportImage,
  onExportSvg,
  canvasRef,
  processing,
  svgContent,
  scale,
  setScale,
  ltres,
  setLtres,
  qtres,
  setQtres,
  pathomit,
  setPathomit,
  colorsampling,
  setColorsampling,
  strokewidth,
  setStrokewidth,
  onDownload,
  getSvgModalWidth,
  getSvgModalHeight,
}) => {
  const [exportType, setExportType] = useState<'image' | 'svg'>('image');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg'>('png');
  const [includeOverlays, setIncludeOverlays] = useState(true);

  const svgBase64 = svgContent ? btoa(unescape(encodeURIComponent(svgContent))) : '';
  const svgDataURI = svgContent ? `data:image/svg+xml;base64,${svgBase64}` : '';

  const handleExport = () => {
    if (exportType === 'image') {
      onExportImage(imageFormat, includeOverlays);
      onCancel();
    } else {
      onExportSvg();
    }
  };

  return (
    <Modal
      title="Export Options"
      open={open}
      onCancel={onCancel}
      onOk={handleExport}
      okText={exportType === 'image' ? 'Export' : 'Convert to SVG'}
      okButtonProps={{ loading: processing && exportType === 'svg' }}
      width={exportType === 'svg' && svgContent ? getSvgModalWidth() : 500}
      style={exportType === 'svg' && svgContent ? { height: getSvgModalHeight() } : undefined}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Export Type Selection */}
        <div>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>Export Format</div>
          <Radio.Group
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="image">Image (PNG/JPG)</Radio.Button>
            <Radio.Button value="svg">SVG</Radio.Button>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Image Export Options */}
        {exportType === 'image' && (
          <div>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>Image Options</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group
                value={imageFormat}
                onChange={(e) => setImageFormat(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="png">PNG</Radio.Button>
                <Radio.Button value="jpg">JPG</Radio.Button>
              </Radio.Group>

              <Checkbox
                checked={includeOverlays}
                onChange={(e) => setIncludeOverlays(e.target.checked)}
              >
                Include overlay layers
              </Checkbox>
              <div style={{ fontSize: 12, color: '#666', marginLeft: 24, marginTop: -8 }}>
                {includeOverlays
                  ? 'Export will include all visible layers and text overlays'
                  : 'Export will only include the base image without layers'}
              </div>
            </Space>
          </div>
        )}

        {/* SVG Export Options */}
        {exportType === 'svg' && (
          <div>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>SVG Tracing Options</div>
            <Space wrap size="small">
              <Tooltip title="Scale factor for the SVG output. Higher = larger SVG.">
                <Space size={4}>
                  <label>Scale</label>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                  <InputNumber
                    size="small"
                    min={0.1}
                    step={0.1}
                    value={scale}
                    onChange={(val) => setScale(val || 1)}
                    style={{ width: 70 }}
                  />
                </Space>
              </Tooltip>
              <Tooltip title="Error threshold for line detection. Lower = more precise lines.">
                <Space size={4}>
                  <label>ltres</label>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                  <InputNumber
                    size="small"
                    min={0}
                    value={ltres}
                    onChange={(val) => setLtres(val || 1)}
                    style={{ width: 70 }}
                  />
                </Space>
              </Tooltip>
              <Tooltip title="Error threshold for curve detection. Lower = more precise curves.">
                <Space size={4}>
                  <label>qtres</label>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                  <InputNumber
                    size="small"
                    min={0}
                    value={qtres}
                    onChange={(val) => setQtres(val || 1)}
                    style={{ width: 70 }}
                  />
                </Space>
              </Tooltip>
              <Tooltip title="Minimum path length to keep. Higher = simpler SVG with fewer tiny paths.">
                <Space size={4}>
                  <label>Pathomit</label>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                  <InputNumber
                    size="small"
                    min={0}
                    value={pathomit}
                    onChange={(val) => setPathomit(val || 0)}
                    style={{ width: 70 }}
                  />
                </Space>
              </Tooltip>
              <Tooltip title="Pixel sampling interval for colors. 1 = every pixel, higher = faster but less accurate colors.">
                <Space size={4}>
                  <label>ColorSampling</label>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                  <InputNumber
                    size="small"
                    min={1}
                    value={colorsampling}
                    onChange={(val) => setColorsampling(val || 1)}
                    style={{ width: 70 }}
                  />
                </Space>
              </Tooltip>
              <Tooltip title="Stroke width in the output SVG.">
                <Space size={4}>
                  <label>StrokeWidth</label>
                  <InfoCircleOutlined style={{ fontSize: 12, color: '#999' }} />
                  <InputNumber
                    size="small"
                    min={0}
                    value={strokewidth}
                    onChange={(val) => setStrokewidth(val || 1)}
                    style={{ width: 70 }}
                  />
                </Space>
              </Tooltip>
            </Space>

            {/* SVG Results */}
            {svgContent && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ marginBottom: 12, fontWeight: 500 }}>SVG Results</div>
                <Tabs defaultActiveKey="svg" type="card" size="small">
                  <Tabs.TabPane tab="Preview" key="svg">
                    <Space style={{ marginBottom: 8 }}>
                      <Button
                        size="small"
                        onClick={() => onDownload(svgContent, 'image.svg')}
                        icon={<DownloadOutlined />}
                      >
                        Download
                      </Button>
                      <Button
                        size="small"
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
                        maxHeight: canvasRef.current ? canvasRef.current.height : 400,
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
                    </div>
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Base64" key="base64">
                    <Space style={{ marginBottom: 8 }}>
                      <Button
                        size="small"
                        onClick={() => handleCopy(svgBase64, 'Base64 copied!')}
                        icon={<CopyOutlined />}
                      >
                        Copy
                      </Button>
                      <Button
                        size="small"
                        onClick={() => onDownload(svgBase64, 'image-base64.txt')}
                        icon={<DownloadOutlined />}
                      >
                        Download
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
                        fontSize: 12,
                      }}
                    >
                      {svgBase64}
                    </pre>
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Data URI" key="datauri">
                    <Space style={{ marginBottom: 8 }}>
                      <Button
                        size="small"
                        onClick={() => handleCopy(svgDataURI, 'Data URI copied!')}
                        icon={<CopyOutlined />}
                      >
                        Copy
                      </Button>
                      <Button
                        size="small"
                        onClick={() => onDownload(svgDataURI, 'image-datauri.txt')}
                        icon={<DownloadOutlined />}
                      >
                        Download
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
                        fontSize: 12,
                      }}
                    >
                      {svgDataURI}
                    </pre>
                  </Tabs.TabPane>
                </Tabs>
              </>
            )}

            {processing && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
                  tip="Converting to SVG..."
                />
              </div>
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default ExportModal;
