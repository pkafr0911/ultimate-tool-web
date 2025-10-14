import React, { useRef, useState, useEffect } from 'react';
import { Card, Input, Button, Space, Typography } from 'antd';
import Hls from 'hls.js';
import dashjs from 'dashjs';

const VideoWatch: React.FC = () => {
  const [url, setUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [type, setType] = useState<string>('unknown');

  useEffect(() => {
    if (!url || !videoRef.current) return;
    const isHls = url.includes('.m3u8');
    const isDash = url.includes('.mpd');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current!);
      setType('HLS');
      return () => hls.destroy();
    }
    if (isDash) {
      const player = dashjs.MediaPlayer().create();
      player.initialize(videoRef.current!, url, true);
      setType('DASH');
      return () => player.reset();
    }
    // Native playback fallback
    videoRef.current.src = url;
    setType('native');
  }, [url]);

  return (
    <Card title="Video Watch">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.Search
          enterButton="Load"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onSearch={(v) => setUrl(v)}
        />
        <video ref={videoRef} controls style={{ width: '100%', maxHeight: 480 }} />
        <Typography.Text>Detected: {type}</Typography.Text>
      </Space>
    </Card>
  );
};

export default VideoWatch;
