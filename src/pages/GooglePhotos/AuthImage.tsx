import React, { useState, useEffect, useRef } from 'react';
import { FileImageOutlined } from '@ant-design/icons';

interface AuthImageProps {
  /** Drive file ID (used for alt=media fallback). Optional for Photos-only items. */
  fileId?: string;
  /** Direct image URL (thumbnailLink / baseUrl). Loaded directly in <img> first. */
  thumbnailLink?: string;
  accessToken: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  onClick?: () => void;
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

/**
 * Smart image loader:
 * 1. Tries thumbnailLink directly in <img> (no CORS issues — these URLs embed auth)
 * 2. On error, falls back to Drive API alt=media via authenticated fetch → blob URL
 */
const AuthImage: React.FC<AuthImageProps> = ({
  fileId,
  thumbnailLink,
  accessToken,
  alt = '',
  className,
  style,
  size = 400,
  onClick,
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<'direct' | 'fetch' | 'done' | 'error'>('direct');

  // Build the direct URL (no fetch needed — embed auth is in the URL itself)
  const directUrl = thumbnailLink
    ? thumbnailLink.replace(/=s\d+/, `=s${size}`).replace(/=w\d+-h\d+/, `=w${size}-h${size}`)
    : null;

  useEffect(() => {
    setSrc(null);
    setPhase('direct');
  }, [fileId, thumbnailLink, accessToken, size]);

  // Phase: fetch fallback via Drive API
  useEffect(() => {
    if (phase !== 'fetch') return;
    if (!accessToken || !fileId) {
      setPhase('error');
      return;
    }

    let cancelled = false;
    const url = `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`;

    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const objUrl = URL.createObjectURL(blob);
        setSrc(objUrl);
        setPhase('done');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });

    return () => {
      cancelled = true;
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [phase, fileId, accessToken]);

  const handleImgError = () => {
    if (phase === 'direct') {
      // thumbnailLink failed — try authenticated fetch
      setPhase('fetch');
    } else {
      setPhase('error');
    }
  };

  if (phase === 'error' || (!directUrl && !fileId)) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#bbb',
          fontSize: 32,
          minHeight: 120,
          ...style,
        }}
        onClick={onClick}
      >
        <FileImageOutlined />
      </div>
    );
  }

  // Show direct <img> with thumbnail URL (phase: direct)
  if (phase === 'direct' && directUrl) {
    return (
      <img
        src={directUrl}
        alt={alt}
        className={className}
        style={style}
        draggable={false}
        onClick={onClick}
        onError={handleImgError}
      />
    );
  }

  // Show fetch result (phase: done)
  if (phase === 'done' && src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        draggable={false}
        onClick={onClick}
      />
    );
  }

  // Loading placeholder (phase: fetch in progress, or no directUrl)
  if (phase === 'direct' && !directUrl) {
    // No thumbnail URL — skip straight to fetch
    setPhase('fetch');
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#f0f0f0',
        minHeight: 120,
        ...style,
      }}
      onClick={onClick}
    />
  );
};

export default AuthImage;
