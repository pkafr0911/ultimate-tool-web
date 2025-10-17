import { Button, Card, Col, Input, Row, Space, Table, Typography } from 'antd';
import dashjs from 'dashjs';
import Hls, { ErrorData, Events, FragLoadedData } from 'hls.js';
import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_URL } from './constants';
import './styles.less';

const { Text } = Typography;

type SegmentInfo = {
  key: string;
  type: string;
  url: string;
  bitrate?: number;
  resolution?: string;
  bytesLoaded?: number;
};

const MAX_SEGMENTS = 200;

const VideoWatch: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);

  const [url, setUrl] = useState(DEFAULT_URL);
  const [type, setType] = useState('unknown');
  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [resolution, setResolution] = useState('');
  const [fps, setFps] = useState('');
  const [codec, setCodec] = useState('');
  const [audio, setAudio] = useState('');
  const [fragDuration, setFragDuration] = useState(0);
  const [programDateTime, setProgramDateTime] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // --- Thumbnails ---
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState<number | null>(null);

  const addLog = (msg: string) =>
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const captureThumbnail = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 90;
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      setThumbnails((prev) => {
        const newThumbs = [...prev, imageData];
        setCurrentThumbnailIndex(newThumbs.length - 1);
        return newThumbs.slice(-10); // keep last 10 thumbnails
      });
    }
  };

  useEffect(() => {
    if (thumbnailsContainerRef.current) {
      thumbnailsContainerRef.current.scrollLeft = thumbnailsContainerRef.current.scrollWidth;
    }
  }, [thumbnails]);

  useEffect(() => {
    if (!url || !videoRef.current) return;

    setSegments([]);
    setTotalData(0);
    setBandwidth(0);
    setResolution('');
    setFps('');
    setCodec('');
    setAudio('');
    setFragDuration(0);
    setProgramDateTime(null);
    setLog([]);
    setThumbnails([]);

    const isHls = url.includes('.m3u8');
    const isDash = url.includes('.mpd');

    // --- HLS ---
    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current!);
      setType('HLS');

      hls.on(Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => addLog('Autoplay blocked by browser'));
      });

      hls.on(Events.FRAG_LOADED, (_e, data: FragLoadedData) => {
        const size = data.frag.stats.total;
        const duration = data.frag.duration;
        const bitrate = (size * 8) / duration;

        setBandwidth(hls.bandwidthEstimate);
        setResolution(hls.levels[hls.currentLevel]?.attrs.RESOLUTION || '');
        setFps(hls.levels[hls.currentLevel]?.attrs['FRAME-RATE'] || '');
        setCodec(hls.levels[hls.currentLevel]?.attrs.CODECS || '');
        setAudio(hls.levels[hls.currentLevel]?.attrs.AUDIO || '');
        setFragDuration(duration);
        setProgramDateTime(data.frag.rawProgramDateTime || null);
        setTotalData((prev) => prev + size);

        setSegments((prev) => {
          const updated = [
            {
              key: `${data.frag.sn}-${Date.now()}`,
              type: 'HLS',
              url: data.frag.url,
              bitrate,
              resolution: hls.levels[hls.currentLevel]?.attrs.RESOLUTION,
              bytesLoaded: size,
            },
            ...prev, // new segment on top
          ];
          return updated.slice(0, MAX_SEGMENTS);
        });

        captureThumbnail();
      });

      hls.on(Events.ERROR, (_e, data: ErrorData) => {
        addLog(`HLS ERROR: ${data.type} - ${data.details}`);
      });

      return () => hls.destroy();
    }

    // --- DASH ---
    if (isDash) {
      const dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.initialize(videoRef.current!, url, true);
      setType('DASH');
      videoRef.current?.play().catch(() => addLog('Autoplay blocked by browser'));

      // Disable info table + thumbnails for DASH
      setSegments([]);
      setThumbnails([]);
      setBandwidth(0);
      setResolution('');
      setFps('');
      setCodec('');
      setAudio('');
      setFragDuration(0);
      setProgramDateTime(null);

      dashPlayer.on('error', (e: any) => {
        addLog(`DASH ERROR: ${e?.error || 'Unknown error'}`);
      });

      return () => dashPlayer.reset();

      // const dashPlayer = dashjs.MediaPlayer().create();
      // dashPlayer.initialize(videoRef.current!, url, true);
      // setType('DASH');

      // dashPlayer.on('httpRequest', (_e: any, req: any) => {
      //   const size = req.bytesLoaded || 0;
      //   const bitrate = req.mediaBitrate || 0;
      //   const res = `${videoRef.current?.videoWidth || 0}x${videoRef.current?.videoHeight || 0}`;

      //   setTotalData((prev) => prev + size);
      //   setBandwidth(bitrate);
      //   setResolution(res);

      //   setSegments((prev) => [
      //     ...prev,
      //     {
      //       key: `${req.requestId}-${Date.now()}`,
      //       type: 'DASH',
      //       url: req.url,
      //       bitrate,
      //       resolution: res,
      //       bytesLoaded: size,
      //     },
      //   ]);
      // });

      // dashPlayer.on('error', (_e: any, err: any) => addLog(`DASH ERROR: ${err.error}`));

      // return () => dashPlayer.reset();
    }

    // --- Native fallback ---
    videoRef.current.src = url;
    setType('native');
    videoRef.current.play().catch(() => addLog('Autoplay blocked by browser'));
  }, [url]);

  // --- Clear function ---
  const handleClear = () => {
    setUrl('');
    setType('unknown');
    setSegments([]);
    setTotalData(0);
    setBandwidth(0);
    setResolution('');
    setFps('');
    setCodec('');
    setAudio('');
    setFragDuration(0);
    setProgramDateTime(null);
    setLog([]);
    setThumbnails([]);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const columns = [
    { title: 'Type', dataIndex: 'type', key: 'type', width: 80 },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: 'Bitrate',
      dataIndex: 'bitrate',
      key: 'bitrate',
      render: (b: number) => FormatBandWidth(b),
    },
    { title: 'Resolution', dataIndex: 'resolution', key: 'resolution', width: 120 },
    {
      title: 'Bytes Loaded',
      dataIndex: 'bytesLoaded',
      key: 'bytesLoaded',
      render: (b: number) => FormatBytes(b),
      width: 120,
    },
  ];

  return (
    <Card title="Video Watch Streaming Info">
      <Row gutter={16}>
        <Col span={24}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Enter stream URL (.m3u8 or .mpd)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button danger onClick={handleClear}>
              Clear
            </Button>
          </Space.Compact>
          <video
            ref={videoRef}
            controls
            style={{ width: '100%', maxHeight: 480, marginTop: 8, background: '#000' }}
          />
        </Col>

        {/* Only show when not DASH */}
        {type === 'HLS' && (
          <>
            {/* Thumbnails */}
            <Col span={24}>
              <div
                style={{ display: 'flex', overflowX: 'auto', marginTop: '10px' }}
                ref={thumbnailsContainerRef}
              >
                {thumbnails.map((thumb, index) => (
                  <img
                    key={index}
                    src={thumb}
                    alt={`Frame ${index}`}
                    style={{
                      width: '160px',
                      height: '90px',
                      marginRight: '5px',
                      cursor: 'pointer',
                      border: currentThumbnailIndex === index ? '3px solid red' : 'none',
                      boxShadow:
                        currentThumbnailIndex === index
                          ? '0px 0px 10px red'
                          : '0 0 3px rgba(0,0,0,0.3)',
                    }}
                    onClick={() => setCurrentThumbnailIndex(index)}
                  />
                ))}
              </div>
            </Col>

            <Col span={24} style={{ marginTop: 16 }}>
              <Text>Detected: {type}</Text> | <Text>Resolution: {resolution}</Text> |{' '}
              <Text>FPS: {fps}</Text> | <Text>Codec: {codec}</Text> | <Text>Audio: {audio}</Text> |{' '}
              <Text>Fragment Duration: {fragDuration}</Text> |{' '}
              <Text>Program Date: {programDateTime}</Text> |{' '}
              <Text>Bandwidth Estimate: {FormatBandWidth(bandwidth)}</Text> |{' '}
              <Text>Data Transferred: {FormatBytes(totalData)}</Text>
            </Col>

            <Col span={24} style={{ marginTop: 16 }}>
              <Table
                columns={columns}
                dataSource={segments}
                pagination={{ pageSize: 5 }}
                size="small"
                scroll={{ y: 200 }}
              />
            </Col>
          </>
        )}

        <Col span={24} style={{ marginTop: 16 }}>
          <Text strong>Logs:</Text>
          <textarea
            readOnly
            value={log.join('\n')}
            style={{ width: '100%', height: 150, padding: 8 }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default VideoWatch;

// ---- Helpers ----
export const FormatBandWidth = (bps: number | undefined): string => {
  if (!bps || bps <= 0) return '0 bps';
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  let i = 0;
  let value = bps;
  while (value >= 1000 && i < units.length - 1) {
    value /= 1000;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
};

export const FormatBytes = (bytes: number | undefined): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
};
