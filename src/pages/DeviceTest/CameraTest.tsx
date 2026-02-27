import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CameraOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SwapOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const { Text, Title } = Typography;

interface QualityMetrics {
  brightness: number; // 0-255
  contrast: number; // 0-100
  saturation: number; // 0-100
  sharpness: number; // 0-100
  noise: number; // 0-100
  colorTemp: number; // estimated Kelvin
  rHistogram: number[];
  gHistogram: number[];
  bHistogram: number[];
}

const QUALITY_HISTORY_LENGTH = 60;

function rateMetric(value: number, low: number, high: number): { label: string; color: string } {
  if (value < low) return { label: 'Low', color: '#ff4d4f' };
  if (value > high) return { label: 'High', color: '#ff4d4f' };
  return { label: 'Good', color: '#52c41a' };
}

function analyzeFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): QualityMetrics | null {
  if (!video.videoWidth || !video.videoHeight) return null;

  // Sample at reduced resolution for performance
  const scale = 0.25;
  const w = Math.floor(video.videoWidth * scale);
  const h = Math.floor(video.videoHeight * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const pixelCount = w * h;

  const rHist = new Array(256).fill(0);
  const gHist = new Array(256).fill(0);
  const bHist = new Array(256).fill(0);

  let totalLum = 0;
  let totalSat = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rHist[r]++;
    gHist[g]++;
    bHist[b]++;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLum += lum;
    totalR += r;
    totalG += g;
    totalB += b;

    // Saturation via HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const sat = max === min ? 0 : (max - min) / (l > 127.5 ? 510 - max - min : max + min);
    totalSat += sat;
  }

  const brightness = totalLum / pixelCount;
  const avgSat = (totalSat / pixelCount) * 100;
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;

  // Contrast: std deviation of luminance
  let lumVariance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lumVariance += (lum - brightness) ** 2;
  }
  const contrast = Math.min(100, (Math.sqrt(lumVariance / pixelCount) / 128) * 100);

  // Sharpness: Laplacian variance (sample every 2nd pixel for speed)
  let laplacianSum = 0;
  let laplacianCount = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const idx = (y * w + x) * 4;
      const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const top =
        0.299 * data[idx - w * 4] + 0.587 * data[idx - w * 4 + 1] + 0.114 * data[idx - w * 4 + 2];
      const bottom =
        0.299 * data[idx + w * 4] + 0.587 * data[idx + w * 4 + 1] + 0.114 * data[idx + w * 4 + 2];
      const left = 0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2];
      const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const lap = Math.abs(top + bottom + left + right - 4 * center);
      laplacianSum += lap;
      laplacianCount++;
    }
  }
  const sharpness = Math.min(100, (laplacianSum / laplacianCount / 50) * 100);

  // Noise: local variance on small patches
  let noiseSum = 0;
  let noiseCount = 0;
  const patchSize = 4;
  for (let py = 0; py < h - patchSize; py += patchSize * 2) {
    for (let px = 0; px < w - patchSize; px += patchSize * 2) {
      let patchMean = 0;
      const patchPixels: number[] = [];
      for (let dy = 0; dy < patchSize; dy++) {
        for (let dx = 0; dx < patchSize; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          patchPixels.push(lum);
          patchMean += lum;
        }
      }
      patchMean /= patchPixels.length;
      let patchVar = 0;
      for (const p of patchPixels) patchVar += (p - patchMean) ** 2;
      noiseSum += patchVar / patchPixels.length;
      noiseCount++;
    }
  }
  const noise = Math.min(100, (Math.sqrt(noiseSum / noiseCount) / 30) * 100);

  // Color temperature estimate (simple McCamy's approximation from RGB ratios)
  const rRatio = avgR / (avgR + avgG + avgB);
  const bRatio = avgB / (avgR + avgG + avgB);
  const colorTemp = Math.round(6500 + (rRatio - bRatio) * 15000);

  return {
    brightness,
    contrast,
    saturation: avgSat,
    sharpness,
    noise,
    colorTemp: Math.max(2000, Math.min(12000, colorTemp)),
    rHistogram: rHist,
    gHistogram: gHist,
    bHistogram: bHist,
  };
}

const CameraTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [mirrored, setMirrored] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string>('');
  const [cameraInfo, setCameraInfo] = useState<Record<string, string>>({});
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [qualityHistory, setQualityHistory] = useState<{
    brightness: number[];
    contrast: number[];
    sharpness: number[];
    noise: number[];
    fps: number[];
  }>({ brightness: [], contrast: [], sharpness: [], noise: [], fps: [] });
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(performance.now());
  const animRef = useRef<number>(0);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval>>(0 as any);

  // Enumerate video devices
  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch {
      setError('Unable to enumerate devices');
    }
  }, [selectedDevice]);

  // Start camera
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        setError('');
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        // Extract camera info
        const track = newStream.getVideoTracks()[0];
        const settings = track.getSettings();
        const capabilities = track.getCapabilities?.() as any;
        setCameraInfo({
          Label: track.label,
          Resolution: `${settings.width} × ${settings.height}`,
          'Frame Rate': `${settings.frameRate} fps`,
          'Facing Mode': settings.facingMode || 'N/A',
          'Aspect Ratio': settings.aspectRatio?.toFixed(2) || 'N/A',
          'Max Resolution': capabilities
            ? `${capabilities.width?.max} × ${capabilities.height?.max}`
            : 'N/A',
        });
      } catch (err: any) {
        setError(err.message || 'Camera access denied');
      }
    },
    [stream],
  );

  // FPS counter
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    const countFps = () => {
      fpsFrameCount.current++;
      const now = performance.now();
      if (now - fpsLastTime.current >= 1000) {
        setFps(fpsFrameCount.current);
        fpsFrameCount.current = 0;
        fpsLastTime.current = now;
      }
      animRef.current = requestAnimationFrame(countFps);
    };
    video.onplay = () => {
      animRef.current = requestAnimationFrame(countFps);
    };
    return () => cancelAnimationFrame(animRef.current);
  }, [stream]);

  // Frame quality analysis (every 500ms to avoid perf issues)
  useEffect(() => {
    if (!stream || !videoRef.current) {
      setQuality(null);
      return;
    }
    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    if (!canvas) return;

    analysisIntervalRef.current = setInterval(() => {
      if (video.readyState < 2) return;
      const metrics = analyzeFrame(video, canvas);
      if (metrics) {
        setQuality(metrics);
        setQualityHistory((prev) => {
          const push = (arr: number[], val: number) => {
            const next = [...arr, val];
            return next.length > QUALITY_HISTORY_LENGTH
              ? next.slice(-QUALITY_HISTORY_LENGTH)
              : next;
          };
          return {
            brightness: push(prev.brightness, metrics.brightness),
            contrast: push(prev.contrast, metrics.contrast),
            sharpness: push(prev.sharpness, metrics.sharpness),
            noise: push(prev.noise, metrics.noise),
            fps: push(prev.fps, fps),
          };
        });
      }
    }, 500);

    return () => clearInterval(analysisIntervalRef.current);
  }, [stream, fps]);

  // Auto-start
  useEffect(() => {
    enumerateDevices();
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
      clearInterval(analysisIntervalRef.current);
    };
  }, [stream]);

  // ── Highcharts options ──────────────────────────────────
  const histogramOptions = useMemo<Highcharts.Options>(() => {
    if (!quality) return {};
    return {
      chart: { height: 180, spacing: [5, 5, 5, 5], backgroundColor: 'transparent' },
      title: { text: '' },
      xAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
      },
      yAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
      },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        areaspline: {
          fillOpacity: 0.25,
          lineWidth: 1.5,
          marker: { enabled: false },
          animation: false,
        },
      },
      series: [
        { type: 'areaspline', name: 'Red', data: quality.rHistogram, color: '#ff4d4f' },
        { type: 'areaspline', name: 'Green', data: quality.gHistogram, color: '#52c41a' },
        { type: 'areaspline', name: 'Blue', data: quality.bHistogram, color: '#1677ff' },
      ],
    };
  }, [quality]);

  const timeSeriesOptions = useMemo<Highcharts.Options>(() => {
    return {
      chart: { height: 200, spacing: [10, 10, 10, 10], backgroundColor: 'transparent' },
      title: { text: '' },
      xAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: '' },
        gridLineColor: 'rgba(128,128,128,0.15)',
        labels: { style: { fontSize: '10px' } },
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px' },
      },
      credits: { enabled: false },
      tooltip: {
        shared: true,
        valueSuffix: '',
        headerFormat: '',
      },
      plotOptions: {
        spline: {
          lineWidth: 2,
          marker: { enabled: false },
          animation: false,
        },
      },
      series: [
        {
          type: 'spline',
          name: 'Brightness',
          data: qualityHistory.brightness.map((v) => Math.round((v / 255) * 100)),
          color: '#faad14',
        },
        {
          type: 'spline',
          name: 'Contrast',
          data: qualityHistory.contrast.map(Math.round),
          color: '#1677ff',
        },
        {
          type: 'spline',
          name: 'Sharpness',
          data: qualityHistory.sharpness.map(Math.round),
          color: '#52c41a',
        },
        {
          type: 'spline',
          name: 'Noise',
          data: qualityHistory.noise.map(Math.round),
          color: '#ff4d4f',
        },
      ],
    };
  }, [qualityHistory]);

  const fpsChartOptions = useMemo<Highcharts.Options>(() => {
    return {
      chart: { height: 140, spacing: [10, 10, 5, 10], backgroundColor: 'transparent' },
      title: { text: '' },
      xAxis: {
        labels: { enabled: false },
        title: { text: '' },
        gridLineWidth: 0,
        tickWidth: 0,
      },
      yAxis: {
        min: 0,
        title: { text: '' },
        gridLineColor: 'rgba(128,128,128,0.15)',
        labels: { style: { fontSize: '10px' } },
      },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: { valueSuffix: ' fps', headerFormat: '' },
      plotOptions: {
        area: {
          fillOpacity: 0.15,
          lineWidth: 2,
          marker: { enabled: false },
          animation: false,
        },
      },
      series: [{ type: 'area', name: 'FPS', data: qualityHistory.fps, color: '#722ed1' }],
    };
  }, [qualityHistory.fps]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const link = document.createElement('a');
    link.download = `camera-snapshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleRecording = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!stream) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const downloadRecording = () => {
    if (!recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `camera-recording-${Date.now()}.webm`;
    a.click();
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    startCamera(deviceId);
  };

  return (
    <div className="camera-test">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <VideoCameraOutlined />
                Camera Preview
                {stream && <Tag color="green">{fps} FPS</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Switch
                  checkedChildren="Mirror"
                  unCheckedChildren="Normal"
                  checked={mirrored}
                  onChange={setMirrored}
                />
              </Space>
            }
          >
            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

            <div className="camera-preview-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
                style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
              />
              {!stream && !error && (
                <div className="camera-placeholder">
                  <VideoCameraOutlined style={{ fontSize: 64, opacity: 0.3 }} />
                  <Text type="secondary" style={{ marginTop: 16 }}>
                    Click &quot;Start Camera&quot; to begin testing
                  </Text>
                </div>
              )}
              {recording && <div className="recording-indicator">● REC</div>}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <canvas ref={analysisCanvasRef} style={{ display: 'none' }} />

            <div style={{ marginTop: 16 }}>
              <Space wrap>
                <Select
                  style={{ width: 300 }}
                  placeholder="Select camera"
                  value={selectedDevice || undefined}
                  onChange={handleDeviceChange}
                  options={devices.map((d) => ({
                    label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
                    value: d.deviceId,
                  }))}
                />
                {!stream ? (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => startCamera(selectedDevice)}
                  >
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => {
                      stream.getTracks().forEach((t) => t.stop());
                      setStream(null);
                      setCameraInfo({});
                    }}
                  >
                    Stop Camera
                  </Button>
                )}
                <Button icon={<CameraOutlined />} onClick={takeSnapshot} disabled={!stream}>
                  Snapshot
                </Button>
                <Button
                  icon={recording ? <StopOutlined /> : <VideoCameraOutlined />}
                  onClick={toggleRecording}
                  disabled={!stream}
                  danger={recording}
                >
                  {recording ? 'Stop Recording' : 'Record'}
                </Button>
                {recordedUrl && (
                  <Button icon={<DownloadOutlined />} onClick={downloadRecording}>
                    Download Recording
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card title="Camera Information" size="small">
              {Object.keys(cameraInfo).length > 0 ? (
                <Descriptions column={1} size="small" bordered>
                  {Object.entries(cameraInfo).map(([key, val]) => (
                    <Descriptions.Item label={key} key={key}>
                      {val}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              ) : (
                <Text type="secondary">Start camera to see device information</Text>
              )}
            </Card>

            {quality && (
              <Card title="Image Quality" size="small">
                <div className="camera-quality-metrics">
                  {[
                    {
                      label: 'Brightness',
                      value: quality.brightness,
                      max: 255,
                      percent: Math.round((quality.brightness / 255) * 100),
                      rating: rateMetric(quality.brightness, 60, 200),
                      tooltip:
                        'Average luminance of the frame. Too dark (<60) or too bright (>200) is flagged.',
                      color: '#faad14',
                    },
                    {
                      label: 'Contrast',
                      value: quality.contrast,
                      max: 100,
                      percent: Math.round(quality.contrast),
                      rating: rateMetric(quality.contrast, 15, 90),
                      tooltip: 'Standard deviation of luminance. Low means flat/washed out image.',
                      color: '#1677ff',
                    },
                    {
                      label: 'Saturation',
                      value: quality.saturation,
                      max: 100,
                      percent: Math.round(quality.saturation),
                      rating: rateMetric(quality.saturation, 10, 85),
                      tooltip: 'Average color saturation. Low means desaturated/gray image.',
                      color: '#eb2f96',
                    },
                    {
                      label: 'Sharpness',
                      value: quality.sharpness,
                      max: 100,
                      percent: Math.round(quality.sharpness),
                      rating: rateMetric(quality.sharpness, 10, 101),
                      tooltip: 'Edge detection via Laplacian. Low means blurry image.',
                      color: '#52c41a',
                    },
                    {
                      label: 'Noise',
                      value: quality.noise,
                      max: 100,
                      percent: Math.round(quality.noise),
                      rating: rateMetric(100 - quality.noise, 30, 101),
                      tooltip: 'Local variance estimation. High means noisy/grainy image.',
                      color: '#ff4d4f',
                    },
                  ].map((m) => (
                    <div key={m.label} className="camera-metric-row">
                      <div className="camera-metric-header">
                        <Tooltip title={m.tooltip}>
                          <Text strong style={{ fontSize: 12 }}>
                            {m.label}
                          </Text>
                        </Tooltip>
                        <Space size={4}>
                          <Tag
                            color={m.rating.color === '#52c41a' ? 'success' : 'error'}
                            style={{ margin: 0, fontSize: 10 }}
                          >
                            {m.rating.label}
                          </Tag>
                          <Text code style={{ fontSize: 11 }}>
                            {m.percent}%
                          </Text>
                        </Space>
                      </div>
                      <Progress
                        percent={m.percent}
                        showInfo={false}
                        strokeColor={m.color}
                        size="small"
                      />
                    </div>
                  ))}

                  <div className="camera-metric-row" style={{ marginTop: 8 }}>
                    <div className="camera-metric-header">
                      <Tooltip title="Estimated correlated color temperature based on RGB ratios">
                        <Text strong style={{ fontSize: 12 }}>
                          Color Temp
                        </Text>
                      </Tooltip>
                      <Text code style={{ fontSize: 11 }}>
                        ~{quality.colorTemp}K
                      </Text>
                    </div>
                    <div className="camera-color-temp-bar">
                      <div
                        className="camera-color-temp-indicator"
                        style={{
                          left: `${((quality.colorTemp - 2000) / 10000) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="camera-color-temp-labels">
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Warm 2000K
                      </Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        Cool 12000K
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {/* ── Charts row ────────────────────────────────────── */}
      {stream && quality && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="RGB Histogram" size="small">
              <HighchartsReact highcharts={Highcharts} options={histogramOptions} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Quality Over Time" size="small">
              <HighchartsReact highcharts={Highcharts} options={timeSeriesOptions} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="FPS Over Time" size="small">
              <HighchartsReact highcharts={Highcharts} options={fpsChartOptions} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Quality Summary" size="small">
              <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
                <Descriptions.Item label="Overall">
                  {(() => {
                    const score = Math.round(
                      (quality.brightness > 60 && quality.brightness < 200 ? 25 : 5) +
                        (quality.contrast > 15 ? 25 : 10) +
                        (quality.sharpness > 10 ? 25 : 10) +
                        (quality.noise < 50 ? 25 : 5),
                    );
                    return (
                      <Tag color={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error'}>
                        {score >= 80 ? 'Excellent' : score >= 50 ? 'Acceptable' : 'Poor'} ({score}
                        /100)
                      </Tag>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Brightness">
                  {quality.brightness < 60
                    ? '⚠️ Too dark – improve lighting'
                    : quality.brightness > 200
                      ? '⚠️ Overexposed – reduce light'
                      : '✅ Good exposure'}
                </Descriptions.Item>
                <Descriptions.Item label="Focus">
                  {quality.sharpness < 10
                    ? '⚠️ Blurry – check focus'
                    : quality.sharpness < 30
                      ? '⚠️ Slightly soft'
                      : '✅ Sharp'}
                </Descriptions.Item>
                <Descriptions.Item label="Noise">
                  {quality.noise > 60
                    ? '⚠️ Very noisy – improve lighting'
                    : quality.noise > 30
                      ? '⚠️ Some noise detected'
                      : '✅ Clean image'}
                </Descriptions.Item>
                <Descriptions.Item label="Color">
                  {quality.saturation < 10
                    ? '⚠️ Very desaturated'
                    : quality.saturation > 85
                      ? '⚠️ Oversaturated'
                      : '✅ Good color'}
                </Descriptions.Item>
                <Descriptions.Item label="Temperature">
                  {quality.colorTemp < 3500
                    ? '🔶 Very warm (indoor/tungsten)'
                    : quality.colorTemp > 7500
                      ? '🔷 Very cool (shade/overcast)'
                      : '✅ Neutral'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CameraTest;
