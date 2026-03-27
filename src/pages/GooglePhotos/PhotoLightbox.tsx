import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Typography, Spin, Button, Space, Tooltip, message } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateRightOutlined,
} from '@ant-design/icons';
import { MediaItem } from './mediaTypes';
import { downloadToBlob } from '../GoogleDrive/utils/driveApi';
import AuthImage from './AuthImage';
import './lightbox.less';

const { Text, Paragraph } = Typography;

interface PhotoLightboxProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onChange: (index: number) => void;
  accessToken: string | null;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  items,
  currentIndex,
  onClose,
  onChange,
  accessToken,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const item = currentIndex >= 0 && currentIndex < items.length ? items[currentIndex] : null;
  const isVideo = item?.mimeType.startsWith('video/');
  const isVisible = currentIndex >= 0;

  // Load full-res media
  useEffect(() => {
    if (!item || !accessToken) {
      setBlobUrl(null);
      return;
    }
    setLoading(true);
    setZoom(1);
    setRotation(0);
    let cancelled = false;

    if (item.source === 'photos' && item.fullUrl) {
      // Photos API: use baseUrl with size params directly
      setBlobUrl(item.fullUrl);
      setLoading(false);
    } else if (item.driveFileId) {
      // Drive API: download via authenticated fetch
      downloadToBlob(accessToken, item.driveFileId)
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        })
        .catch(() => {
          if (!cancelled) setBlobUrl(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // Fallback: use thumbnail
      setBlobUrl(item.thumbnailUrl ?? null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        // Only revoke object URLs (blob:), not regular URLs
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [item?.id, accessToken]);

  const go = useCallback(
    (delta: number) => {
      const next = currentIndex + delta;
      if (next >= 0 && next < items.length) onChange(next);
    },
    [currentIndex, items.length, onChange],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          go(-1);
          break;
        case 'ArrowRight':
          go(1);
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(z + 0.25, 5));
          break;
        case '-':
          setZoom((z) => Math.max(z - 0.25, 0.25));
          break;
        case 'r':
          setRotation((r) => r + 90);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isVisible, go, onClose]);

  const handleDownload = async () => {
    if (!item || !accessToken) return;
    try {
      let blob: Blob;
      if (item.source === 'photos' && item.fullUrl) {
        // Photos API: fetch the full-res URL directly
        const res = await fetch(item.fullUrl);
        if (!res.ok) throw new Error('Download failed');
        blob = await res.blob();
      } else if (item.driveFileId) {
        blob = await downloadToBlob(accessToken, item.driveFileId);
      } else {
        message.error('Download not available');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      message.error('Download failed');
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => {
        const next = z + (e.deltaY > 0 ? -0.15 : 0.15);
        return Math.max(0.25, Math.min(5, next));
      });
    }
  }, []);

  if (!isVisible || !item) return null;

  const fileSize = item.size ? `${(Number(item.size) / (1024 * 1024)).toFixed(2)} MB` : '—';

  return (
    <div className="pl-overlay" onClick={onClose}>
      <div
        className="pl-content"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
        onWheel={handleWheel}
      >
        {/* Top bar */}
        <div className="pl-topbar">
          <Text className="pl-filename" ellipsis>
            {item.name}
          </Text>
          <Space>
            <Tooltip title="Zoom in (+)">
              <Button
                type="text"
                icon={<ZoomInOutlined />}
                onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
                className="pl-btn"
              />
            </Tooltip>
            <Tooltip title="Zoom out (-)">
              <Button
                type="text"
                icon={<ZoomOutOutlined />}
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                className="pl-btn"
              />
            </Tooltip>
            <Tooltip title="Rotate (R)">
              <Button
                type="text"
                icon={<RotateRightOutlined />}
                onClick={() => setRotation((r) => r + 90)}
                className="pl-btn"
              />
            </Tooltip>
            <Tooltip title="Download">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="pl-btn"
              />
            </Tooltip>
            <Tooltip title="Info">
              <Button
                type="text"
                icon={<InfoCircleOutlined />}
                onClick={() => setShowInfo(!showInfo)}
                className="pl-btn"
              />
            </Tooltip>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              className="pl-btn pl-close"
            />
          </Space>
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button className="pl-nav pl-nav-left" onClick={() => go(-1)}>
            <LeftOutlined />
          </button>
        )}
        {currentIndex < items.length - 1 && (
          <button className="pl-nav pl-nav-right" onClick={() => go(1)}>
            <RightOutlined />
          </button>
        )}

        {/* Media area */}
        <div className="pl-media-area">
          {loading && !blobUrl ? (
            <Spin size="large" />
          ) : isVideo ? (
            <video
              src={blobUrl || undefined}
              controls
              autoPlay
              className="pl-video"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          ) : blobUrl ? (
            <img
              src={blobUrl}
              alt={item.name}
              className="pl-image"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable={false}
            />
          ) : (
            <AuthImage
              fileId={item.driveFileId}
              thumbnailLink={item.thumbnailUrl}
              accessToken={accessToken}
              alt={item.name}
              size={1600}
              className="pl-image"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          )}
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="pl-info-panel">
            <div className="pl-info-title">Details</div>
            <div className="pl-info-row">
              <Text type="secondary">Name</Text>
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, color: '#fff' }}>
                {item.name}
              </Paragraph>
            </div>
            <div className="pl-info-row">
              <Text type="secondary">Type</Text>
              <Text style={{ color: '#fff' }}>{item.mimeType}</Text>
            </div>
            <div className="pl-info-row">
              <Text type="secondary">Size</Text>
              <Text style={{ color: '#fff' }}>{fileSize}</Text>
            </div>
            <div className="pl-info-row">
              <Text type="secondary">Source</Text>
              <Text style={{ color: '#fff' }}>
                {item.source === 'photos' ? 'Google Photos' : 'Google Drive'}
              </Text>
            </div>
            {item.width && item.height && (
              <div className="pl-info-row">
                <Text type="secondary">Dimensions</Text>
                <Text style={{ color: '#fff' }}>
                  {item.width} × {item.height}
                </Text>
              </div>
            )}
            {item.createdTime && (
              <div className="pl-info-row">
                <Text type="secondary">Created</Text>
                <Text style={{ color: '#fff' }}>{new Date(item.createdTime).toLocaleString()}</Text>
              </div>
            )}
            {item.ownerName && (
              <div className="pl-info-row">
                <Text type="secondary">Owner</Text>
                <Text style={{ color: '#fff' }}>{item.ownerName}</Text>
              </div>
            )}
          </div>
        )}

        {/* Bottom counter */}
        <div className="pl-counter">
          {currentIndex + 1} / {items.length}
        </div>
      </div>
    </div>
  );
};

export default PhotoLightbox;
