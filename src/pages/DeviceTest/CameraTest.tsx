import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Select,
  Space,
  Switch,
  Tag,
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

const { Text, Title } = Typography;

const CameraTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(performance.now());
  const animRef = useRef<number>(0);

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

  // Auto-start
  useEffect(() => {
    enumerateDevices();
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, [stream]);

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
          <Card title="Camera Information" style={{ height: '100%' }}>
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
        </Col>
      </Row>
    </div>
  );
};

export default CameraTest;
