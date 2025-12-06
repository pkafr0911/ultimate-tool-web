import React, { useEffect, useRef, useState } from 'react';
import { Button, Slider, Space, Typography, theme } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MutedOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  thumbnails: { src: string; time: string; timestamp: number }[];
  thumbnailsContainerRef: React.RefObject<HTMLDivElement>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  thumbnails,
  thumbnailsContainerRef,
}) => {
  const { token } = theme.useToken();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<{ start: number; end: number }[]>([]);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (playing) {
      setShowControls(false);
    }
  };

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onProgress = () => {
      const ranges: { start: number; end: number }[] = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i),
        });
      }
      setBuffered(ranges);
    };
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('progress', onProgress);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [videoRef]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      if (value > 0 && isMuted) {
        videoRef.current.muted = false;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Find the closest thumbnail to current time
  const getActiveThumbnailIndex = () => {
    if (thumbnails.length === 0) return -1;
    let closestIndex = -1;
    let minDiff = Infinity;

    thumbnails.forEach((thumb, index) => {
      const diff = Math.abs(thumb.timestamp - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    // Highlight if within 2 seconds
    return minDiff < 2 ? closestIndex : -1;
  };

  const activeIndex = getActiveThumbnailIndex();

  return (
    <>
      <div
        className="video-wrapper"
        ref={playerContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          backgroundColor: '#000',
          borderRadius: token.borderRadiusLG,
          overflow: 'hidden',
          boxShadow: token.boxShadow,
          cursor: showControls ? 'default' : 'none',
        }}
      >
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', display: 'block' }}
          onClick={togglePlay}
        />

        {/* Custom Controls Overlay */}
        <div
          className="custom-controls"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '10px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? 'auto' : 'none',
            transition: 'opacity 0.3s',
          }}
        >
          {/* Progress Bar */}
          <div style={{ position: 'relative' }}>
            {duration > 0 &&
              buffered.map((range, i) => {
                const left = (range.start / duration) * 100;
                const width = ((range.end - range.start) / duration) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            <Slider
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              tooltip={{ formatter: (value) => formatTime(value || 0) }}
              trackStyle={{ backgroundColor: token.colorPrimary }}
              handleStyle={{ borderColor: token.colorPrimary }}
              railStyle={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              style={{ margin: '5px 0' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff',
            }}
          >
            <Space>
              <Button
                type="text"
                icon={
                  playing ? (
                    <PauseCircleOutlined style={{ fontSize: '24px', color: '#fff' }} />
                  ) : (
                    <PlayCircleOutlined style={{ fontSize: '24px', color: '#fff' }} />
                  )
                }
                onClick={togglePlay}
              />

              <Space size={4}>
                <Button
                  type="text"
                  icon={
                    isMuted || volume === 0 ? (
                      <MutedOutlined style={{ color: '#fff' }} />
                    ) : (
                      <SoundOutlined style={{ color: '#fff' }} />
                    )
                  }
                  onClick={toggleMute}
                />
                <div style={{ width: 80 }}>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    trackStyle={{ backgroundColor: '#fff' }}
                    handleStyle={{ borderColor: '#fff' }}
                    railStyle={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  />
                </div>
              </Space>

              <Text style={{ color: '#fff', marginLeft: 10 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </Space>

            <Button
              type="text"
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined style={{ fontSize: '20px', color: '#fff' }} />
                ) : (
                  <FullscreenOutlined style={{ fontSize: '20px', color: '#fff' }} />
                )
              }
              onClick={toggleFullscreen}
            />
          </div>
        </div>
      </div>

      {/* Thumbnails Strip */}
      {thumbnails.length > 0 && (
        <div className="thumbnail-strip" ref={thumbnailsContainerRef}>
          {thumbnails.map((thumb, index) => (
            <div
              key={index}
              className="thumbnail-item"
              style={{
                border:
                  index === activeIndex
                    ? `2px solid ${token.colorPrimary}`
                    : '2px solid transparent',
                transform: index === activeIndex ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s',
              }}
            >
              <img src={thumb.src} alt={`Frame ${index}`} />
              <div className="thumb-time">{thumb.time}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default VideoPlayer;
