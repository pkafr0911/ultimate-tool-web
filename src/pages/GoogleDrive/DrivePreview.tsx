import React, { useState, useEffect } from 'react';
import { Modal, Spin, Button, Result, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { DriveFile } from './types';
import { downloadToBlob, exportGoogleDoc, downloadAsText } from './utils/driveApi';

const { Paragraph } = Typography;

interface DrivePreviewProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
}

const GOOGLE_DOCS_MIME = 'application/vnd.google-apps.document';
const GOOGLE_SHEETS_MIME = 'application/vnd.google-apps.spreadsheet';
const GOOGLE_SLIDES_MIME = 'application/vnd.google-apps.presentation';
const GOOGLE_DRAWING_MIME = 'application/vnd.google-apps.drawing';
const GOOGLE_FORM_MIME = 'application/vnd.google-apps.form';

const isGoogleWorkspace = (mime: string) =>
  [
    GOOGLE_DOCS_MIME,
    GOOGLE_SHEETS_MIME,
    GOOGLE_SLIDES_MIME,
    GOOGLE_DRAWING_MIME,
    GOOGLE_FORM_MIME,
  ].includes(mime);

const isTextLike = (mime: string, name: string) => {
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'application/javascript' ||
    mime === 'application/x-yaml' ||
    mime === 'application/x-sh'
  )
    return true;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return [
    'txt',
    'md',
    'csv',
    'log',
    'json',
    'xml',
    'yaml',
    'yml',
    'sh',
    'bat',
    'ini',
    'cfg',
    'env',
    'ts',
    'tsx',
    'js',
    'jsx',
    'html',
    'css',
    'py',
    'java',
    'go',
    'rs',
    'sql',
  ].includes(ext);
};

const DrivePreview: React.FC<DrivePreviewProps> = ({ file, visible, onClose, accessToken }) => {
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && file && accessToken) {
      loadPreview();
    }
    return () => {
      if (contentUrl) URL.revokeObjectURL(contentUrl);
      setContentUrl(null);
      setTextContent(null);
      setError(null);
    };
  }, [visible, file?.id]);

  const loadPreview = async () => {
    if (!file || !accessToken) return;
    setLoading(true);
    setError(null);
    setContentUrl(null);
    setTextContent(null);

    try {
      const mime = file.mimeType;

      // Google Workspace files — embed via iframe, no download needed
      if (isGoogleWorkspace(mime)) {
        setLoading(false);
        return;
      }

      // Images
      if (mime.startsWith('image/')) {
        const blob = await downloadToBlob(accessToken, file.id);
        setContentUrl(URL.createObjectURL(blob));
      }
      // PDF
      else if (mime === 'application/pdf') {
        const blob = await downloadToBlob(accessToken, file.id);
        setContentUrl(URL.createObjectURL(blob));
      }
      // Video
      else if (mime.startsWith('video/')) {
        const blob = await downloadToBlob(accessToken, file.id);
        setContentUrl(URL.createObjectURL(blob));
      }
      // Audio
      else if (mime.startsWith('audio/')) {
        const blob = await downloadToBlob(accessToken, file.id);
        setContentUrl(URL.createObjectURL(blob));
      }
      // Office documents — export to PDF for preview
      else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword'
      ) {
        // Use Google's built-in viewer via webViewLink
        setContentUrl(null);
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mime === 'application/vnd.ms-excel'
      ) {
        setContentUrl(null);
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        mime === 'application/vnd.ms-powerpoint'
      ) {
        setContentUrl(null);
      }
      // Text / code files
      else if (isTextLike(mime, file.name)) {
        const text = await downloadAsText(accessToken, file.id);
        setTextContent(text);
      }
      // Anything else — not supported inline
      else {
        setError('Preview not supported for this file type.');
      }
    } catch {
      setError('Failed to load preview.');
    } finally {
      setLoading(false);
    }
  };

  const getGoogleEmbedUrl = (file: DriveFile) => {
    const mime = file.mimeType;
    const id = file.id;
    if (mime === GOOGLE_DOCS_MIME) return `https://docs.google.com/document/d/${id}/preview`;
    if (mime === GOOGLE_SHEETS_MIME) return `https://docs.google.com/spreadsheets/d/${id}/preview`;
    if (mime === GOOGLE_SLIDES_MIME) return `https://docs.google.com/presentation/d/${id}/preview`;
    if (mime === GOOGLE_DRAWING_MIME) return `https://docs.google.com/drawings/d/${id}/preview`;
    if (mime === GOOGLE_FORM_MIME)
      return `https://docs.google.com/forms/d/${id}/viewform?embedded=true`;
    return null;
  };

  const getGoogleViewerUrl = (fileId: string) =>
    `https://drive.google.com/file/d/${fileId}/preview`;

  const isOfficeMime = (mime: string) =>
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ].includes(mime);

  const renderContent = () => {
    if (loading) return <Spin size="large" />;
    if (!file) return null;

    if (error) {
      return (
        <Result
          status="info"
          title="Preview Unavailable"
          subTitle={error}
          extra={
            <Button type="primary" href={file.webViewLink} target="_blank" icon={<LinkOutlined />}>
              Open in Google Drive
            </Button>
          }
        />
      );
    }

    const mime = file.mimeType;

    // Google Workspace files — embed
    if (isGoogleWorkspace(mime)) {
      const embedUrl = getGoogleEmbedUrl(file);
      return embedUrl ? (
        <iframe
          src={embedUrl}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      ) : null;
    }

    // Images
    if (mime.startsWith('image/') && contentUrl) {
      return (
        <img src={contentUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
      );
    }

    // PDF
    if (mime === 'application/pdf' && contentUrl) {
      return <iframe src={contentUrl} style={{ width: '100%', height: '80vh', border: 'none' }} />;
    }

    // Video
    if (mime.startsWith('video/') && contentUrl) {
      return <video src={contentUrl} controls style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
    }

    // Audio
    if (mime.startsWith('audio/') && contentUrl) {
      return <audio src={contentUrl} controls style={{ width: '100%' }} />;
    }

    // Office documents — use Google's Drive preview
    if (isOfficeMime(mime)) {
      return (
        <iframe
          src={getGoogleViewerUrl(file.id)}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      );
    }

    // Text / code
    if (textContent !== null) {
      return (
        <pre
          style={{
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            background: '#f5f5f5',
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {textContent}
        </pre>
      );
    }

    return null;
  };

  const modalWidth =
    file &&
    (isGoogleWorkspace(file.mimeType) ||
      isOfficeMime(file.mimeType) ||
      file.mimeType === 'application/pdf' ||
      file.mimeType.startsWith('video/'))
      ? '90vw'
      : 800;

  return (
    <Modal
      title={file?.name}
      open={visible}
      onCancel={onClose}
      footer={
        file?.webViewLink ? (
          <Button type="link" href={file.webViewLink} target="_blank" icon={<LinkOutlined />}>
            Open in Google Drive
          </Button>
        ) : null
      }
      width={modalWidth}
      centered
      destroyOnClose
    >
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
      >
        {renderContent()}
      </div>
    </Modal>
  );
};

export default DrivePreview;
