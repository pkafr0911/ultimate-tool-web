import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Modal, Input, message, List, Spin, Space, Empty, Typography, Result } from 'antd';
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  GoogleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import envConfig from '../../../config/envConfig';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const STORAGE_KEY = 'gd_session';
const SCOPES = 'openid profile email https://www.googleapis.com/auth/drive';

declare global {
  interface Window {
    google?: any;
  }
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session.accessToken;
  } catch {
    return null;
  }
}

function ensureGsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

function requestToken(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await ensureGsiScript();
    const clientId = envConfig.googleClientId;
    if (!clientId || !window.google) {
      reject(new Error('Google OAuth not available'));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.access_token) {
          const expiresAt = Date.now() + Number(response.expires_in) * 1000;
          // Fetch user info and save session
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  accessToken: response.access_token,
                  expiresAt,
                  user: { name: data.name, email: data.email, picture: data.picture },
                }),
              );
            }
          } catch {
            // Save without user info
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ accessToken: response.access_token, expiresAt, user: null }),
            );
          }
          resolve(response.access_token);
        } else {
          reject(new Error('No access token'));
        }
      },
      error_callback: () => reject(new Error('Auth cancelled')),
    });
    client.requestAccessToken();
  });
}

export async function getOrRequestToken(): Promise<string | null> {
  const existing = getToken();
  if (existing) return existing;
  try {
    return await requestToken();
  } catch {
    return null;
  }
}

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

// ─── Save to Drive ──────────────────────────────────────────────────

interface SaveToDriveProps {
  getContent: () => string | Blob;
  fileName: string;
  mimeType?: string;
  buttonProps?: Record<string, any>;
  children?: React.ReactNode;
}

export const SaveToDriveButton: React.FC<SaveToDriveProps> = ({
  getContent,
  fileName,
  mimeType = 'text/plain',
  buttonProps = {},
  children,
}) => {
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [saveName, setSaveName] = useState(fileName);

  const handleSave = async () => {
    const token = await getOrRequestToken();
    if (!token) {
      message.error('Google sign-in is required to save to Drive');
      return;
    }

    const content = getContent();
    if (!content || (typeof content === 'string' && !content.trim())) {
      message.warning('Nothing to save');
      return;
    }

    setSaving(true);
    try {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

      const metadata = { name: saveName || fileName, mimeType };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');
      message.success(`Saved "${saveName}" to Google Drive`);
      setShowNameModal(false);
    } catch {
      message.error('Failed to save to Google Drive');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        icon={<CloudUploadOutlined />}
        onClick={() => {
          setSaveName(fileName);
          setShowNameModal(true);
        }}
        {...buttonProps}
      >
        {children ?? 'Save to Drive'}
      </Button>
      <Modal
        title="Save to Google Drive"
        open={showNameModal}
        onOk={handleSave}
        onCancel={() => setShowNameModal(false)}
        confirmLoading={saving}
        okText="Save"
        destroyOnClose
      >
        <Input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="File name"
          addonBefore="Name"
          onPressEnter={handleSave}
        />
      </Modal>
    </>
  );
};

// ─── Load from Drive ────────────────────────────────────────────────

interface LoadFromDriveProps {
  onLoad: (content: string, fileName: string) => void;
  accept?: string[];
  buttonProps?: Record<string, any>;
  children?: React.ReactNode;
}

export const LoadFromDriveButton: React.FC<LoadFromDriveProps> = ({
  onLoad,
  accept,
  buttonProps = {},
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);

  const fetchFiles = useCallback(
    async (token: string, pageToken?: string, searchQuery?: string) => {
      let q = 'trashed=false';
      if (accept?.length) {
        const mimeFilter = accept.map((m) => `mimeType='${m}'`).join(' or ');
        q += ` and (${mimeFilter})`;
      }
      if (searchQuery?.trim()) {
        const escaped = searchQuery.trim().replace(/'/g, "\\'");
        q += ` and name contains '${escaped}'`;
      }
      const params = new URLSearchParams({
        q,
        pageSize: '20',
        fields: 'nextPageToken,files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });
      if (pageToken) params.append('pageToken', pageToken);
      const res = await fetch(`${DRIVE_API}/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('List failed');
      return res.json() as Promise<{ files: DriveFileItem[]; nextPageToken?: string }>;
    },
    [accept],
  );

  const loadInitial = useCallback(
    async (searchQuery?: string) => {
      const token = await getOrRequestToken();
      if (!token) {
        message.error('Google sign-in is required to access Drive');
        return;
      }
      tokenRef.current = token;
      setVisible(true);
      setLoading(true);
      setFiles([]);
      setNextPageToken(undefined);
      try {
        const data = await fetchFiles(token, undefined, searchQuery);
        setFiles(data.files || []);
        setNextPageToken(data.nextPageToken);
      } catch {
        message.error('Failed to list Drive files');
      } finally {
        setLoading(false);
      }
    },
    [fetchFiles],
  );

  const loadMore = useCallback(async () => {
    if (!nextPageToken || loadingMore || !tokenRef.current) return;
    setLoadingMore(true);
    try {
      const data = await fetchFiles(tokenRef.current, nextPageToken, search);
      setFiles((prev) => [...prev, ...(data.files || [])]);
      setNextPageToken(data.nextPageToken);
    } catch {
      message.error('Failed to load more files');
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageToken, loadingMore, search, fetchFiles]);

  // Infinite scroll observer
  useEffect(() => {
    if (!visible) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, loadMore]);

  const handleSelect = async (file: DriveFileItem) => {
    const token = tokenRef.current;
    if (!token) return;
    setDownloading(file.id);
    try {
      const res = await fetch(`${DRIVE_API}/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const text = await res.text();
      onLoad(text, file.name);
      setVisible(false);
      message.success(`Loaded "${file.name}" from Drive`);
    } catch {
      message.error('Failed to load file from Drive');
    } finally {
      setDownloading(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    loadInitial(value);
  };

  const handleClose = () => {
    setVisible(false);
    setSearch('');
    setFiles([]);
    setNextPageToken(undefined);
  };

  return (
    <>
      <Button icon={<CloudDownloadOutlined />} onClick={() => loadInitial(search)} {...buttonProps}>
        {children ?? 'Load from Drive'}
      </Button>
      <Modal
        title="Load from Google Drive"
        open={visible}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Input.Search
          placeholder="Search files..."
          allowClear
          onSearch={handleSearch}
          style={{ marginBottom: 12 }}
          enterButton
        />
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : files.length === 0 ? (
          <Empty description="No matching files found" />
        ) : (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <List
              dataSource={files}
              renderItem={(file) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(file)}
                  actions={[
                    <Button key="load" type="link" size="small" loading={downloading === file.id}>
                      Load
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={file.name}
                    description={
                      file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : undefined
                    }
                  />
                </List.Item>
              )}
            />
            <div ref={sentinelRef} style={{ textAlign: 'center', padding: loadingMore ? 12 : 1 }}>
              {loadingMore && <Spin size="small" />}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
