import { Col, Row, Tabs } from 'antd';
import { FileTextOutlined, LineChartOutlined, AreaChartOutlined } from '@ant-design/icons';
import dashjs from 'dashjs';
import Hls, { ErrorData, Events, FragLoadedData } from 'hls.js';
import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_URL } from './constants';
import './styles.less';
import ControlBar from './components/ControlBar';
import VideoPlayer from './components/VideoPlayer';
import StatsSidebar from './components/StatsSidebar';
import LogViewer from './components/LogViewer';
import SegmentHistory from './components/SegmentHistory';
import BitrateChart from './components/BitrateChart';

type SegmentInfo = {
  key: string;
  type: string;
  url: string;
  bitrate?: number;
  resolution?: string;
  bytesLoaded?: number;
  duration?: number;
};

const MAX_SEGMENTS = 100;

const VideoAnalyzer: React.FC = () => {
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
  const [bufferLength, setBufferLength] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bitrateHistory, setBitrateHistory] = useState<{ timestamp: number; bitrate: number }[]>(
    [],
  );

  // --- Thumbnails ---
  const [thumbnails, setThumbnails] = useState<{ src: string; time: string; timestamp: number }[]>(
    [],
  );

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 99)]);

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
        const newThumbs = [
          ...prev,
          {
            src: imageData,
            time: new Date().toLocaleTimeString(),
            timestamp: video.currentTime,
          },
        ];
        return newThumbs.slice(-20); // keep last 20 thumbnails
      });
    }
  };

  useEffect(() => {
    if (thumbnailsContainerRef.current) {
      thumbnailsContainerRef.current.scrollLeft = thumbnailsContainerRef.current.scrollWidth;
    }
  }, [thumbnails]);

  // Polling for video stats & bitrate history
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        // Buffer length
        const buffered = videoRef.current.buffered;
        const currentTime = videoRef.current.currentTime;
        let buffer = 0;
        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
            buffer = buffered.end(i) - currentTime;
            break;
          }
        }
        setBufferLength(buffer);

        // Dropped frames
        if (videoRef.current.getVideoPlaybackQuality) {
          setDroppedFrames(videoRef.current.getVideoPlaybackQuality().droppedVideoFrames);
        }

        setIsPlaying(!videoRef.current.paused);

        // Update bitrate history
        if (bandwidth > 0) {
          setBitrateHistory((prev) => {
            const newHistory = [...prev, { timestamp: Date.now(), bitrate: bandwidth }];
            return newHistory.slice(-50); // Keep last 50 data points
          });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [bandwidth]);

  useEffect(() => {
    if (!url || !videoRef.current) return;

    // Reset state
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
    setBufferLength(0);
    setDroppedFrames(0);
    setBitrateHistory([]);

    const isHls = url.includes('.m3u8');
    const isDash = url.includes('.mpd');

    let hlsInstance: Hls | null = null;
    let dashPlayer: dashjs.MediaPlayerClass | null = null;

    // --- HLS ---
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });
      hlsInstance = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current!);
      setType('HLS');
      addLog('Initializing HLS player...');

      hls.on(Events.MANIFEST_PARSED, (_e, data) => {
        addLog(`Manifest parsed. Found ${data.levels.length} quality levels.`);
        videoRef.current?.play().catch(() => addLog('Autoplay blocked by browser'));
      });

      hls.on(Events.LEVEL_SWITCHED, (_e, data) => {
        const level = hls.levels[data.level];
        if (level) {
          addLog(`Quality switched to: ${level.height}p @ ${level.bitrate}bps`);
          setResolution(`${level.width}x${level.height}`);
          setBandwidth(level.bitrate);
          if (level.attrs) {
            setFps(level.attrs['FRAME-RATE'] || '');
            setCodec(level.attrs.CODECS || '');
            setAudio(level.attrs.AUDIO || '');
          }
        }
      });

      hls.on(Events.FRAG_LOADED, (_e, data: FragLoadedData) => {
        const size = data.frag.stats.total;
        const duration = data.frag.duration;
        const bitrate = (size * 8) / duration;

        // Update stats if not already set by level switch
        if (!resolution && hls.levels[hls.currentLevel]) {
          const level = hls.levels[hls.currentLevel];
          setResolution(`${level.width}x${level.height}`);
          setBandwidth(level.bitrate);
        }

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
              duration,
            },
            ...prev,
          ];
          return updated.slice(0, MAX_SEGMENTS);
        });

        captureThumbnail();
      });

      hls.on(Events.ERROR, (_e, data: ErrorData) => {
        if (data.fatal) {
          addLog(`HLS FATAL ERROR: ${data.type} - ${data.details}`);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        } else {
          addLog(`HLS ERROR: ${data.details}`);
        }
      });
    }

    // --- DASH ---
    else if (isDash) {
      dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.initialize(videoRef.current!, url, true);
      setType('DASH');
      addLog('Initializing DASH player...');

      dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        addLog('DASH Stream initialized');
        videoRef.current?.play().catch(() => addLog('Autoplay blocked by browser'));
      });

      dashPlayer.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e: any) => {
        if (e.mediaType === 'video') {
          const quality = dashPlayer?.getQualityFor('video');
          const bitrates = dashPlayer?.getBitrateInfoListFor('video');
          if (bitrates && quality !== undefined && bitrates[quality]) {
            const info = bitrates[quality];
            setResolution(`${info.width}x${info.height}`);
            setBandwidth(info.bitrate);
            addLog(`Quality switched to: ${info.width}x${info.height} @ ${info.bitrate}bps`);
          }
        }
      });

      dashPlayer.on(dashjs.MediaPlayer.events.FRAGMENT_LOADING_COMPLETED, (e: any) => {
        // e.request is the request object
        if (e.request && e.request.mediaType === 'video') {
          const size = e.request.bytesLoaded || 0;
          const duration = e.request.duration;
          setTotalData((prev) => prev + size);
          setFragDuration(duration);

          setSegments((prev) => [
            {
              key: `${Date.now()}-${Math.random()}`,
              type: 'DASH',
              url: e.request.url,
              bitrate: 0, // Calculated elsewhere or estimated
              resolution: resolution, // Use current resolution
              bytesLoaded: size,
              duration,
            },
            ...prev.slice(0, MAX_SEGMENTS - 1),
          ]);
          captureThumbnail();
        }
      });

      dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
        addLog(`DASH ERROR: ${e.error.message} (${e.error.code})`);
      });
    }

    // --- Native fallback ---
    else {
      videoRef.current.src = url;
      setType('Native');
      addLog('Using native video player fallback');
      videoRef.current.play().catch(() => addLog('Autoplay blocked by browser'));
    }

    return () => {
      if (hlsInstance) hlsInstance.destroy();
      if (dashPlayer) dashPlayer.reset();
    };
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
    setBufferLength(0);
    setDroppedFrames(0);
    setBitrateHistory([]);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.load();
    }
  };

  return (
    <div className="video-watch-container">
      <Row gutter={[24, 24]}>
        {/* Header & Controls */}
        <Col span={24}>
          <ControlBar url={url} setUrl={setUrl} onLoad={() => setUrl(url)} onReset={handleClear} />
        </Col>

        {/* Main Video Player */}
        <Col xs={24} lg={16}>
          <VideoPlayer
            videoRef={videoRef}
            thumbnails={thumbnails}
            thumbnailsContainerRef={thumbnailsContainerRef}
          />
        </Col>

        {/* Real-time Stats Sidebar */}
        <Col xs={24} lg={8}>
          <StatsSidebar
            type={type}
            resolution={resolution}
            bandwidth={bandwidth}
            totalData={totalData}
            bufferLength={bufferLength}
            droppedFrames={droppedFrames}
            codec={codec}
            audio={audio}
            fps={fps}
            fragDuration={fragDuration}
          />
        </Col>

        {/* Logs & Segments & Chart */}
        <Col span={24}>
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <FileTextOutlined /> Event Logs
                  </span>
                ),
                children: <LogViewer logs={log} />,
              },
              {
                key: '2',
                label: (
                  <span>
                    <LineChartOutlined /> Segment History
                  </span>
                ),
                children: <SegmentHistory segments={segments} />,
              },
              {
                key: '3',
                label: (
                  <span>
                    <AreaChartOutlined /> Bitrate Chart
                  </span>
                ),
                children: <BitrateChart data={bitrateHistory} />,
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default VideoAnalyzer;
