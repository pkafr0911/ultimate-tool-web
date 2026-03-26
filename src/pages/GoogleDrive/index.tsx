import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Space,
  Breadcrumb,
  Avatar,
  Dropdown,
  Menu,
  Typography,
  Segmented,
  Tooltip,
  Input,
  Cascader,
} from 'antd';
import {
  GoogleOutlined,
  LogoutOutlined,
  CloudUploadOutlined,
  TeamOutlined,
  FolderOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { DisplayMode } from './DriveList';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useDriveApi } from './hooks/useDriveApi';
import DriveList from './DriveList';
import DriveDetail from './DriveDetail';
import DrivePreview from './DrivePreview';
import UploadControl from './components/UploadControl';
import {
  RenameModal,
  CopyModal,
  ShareModal,
  MoveModal,
  DeleteConfirm,
} from './components/FileActions';
import { DriveFile } from './types';

type ViewMode = 'my-drive' | 'shared';

/** Maps the leaf (or parent) value to a Google Drive API q clause */
const MIME_Q_MAP: Record<string, string> = {
  all: '',
  folder: "mimeType = 'application/vnd.google-apps.folder'",
  // Google Docs
  gdocs: "mimeType contains 'application/vnd.google-apps.'",
  gdoc: "mimeType = 'application/vnd.google-apps.document'",
  gsheet: "mimeType = 'application/vnd.google-apps.spreadsheet'",
  gslide: "mimeType = 'application/vnd.google-apps.presentation'",
  gform: "mimeType = 'application/vnd.google-apps.form'",
  // Images
  image: "mimeType contains 'image/'",
  jpeg: "mimeType = 'image/jpeg'",
  png: "mimeType = 'image/png'",
  gif: "mimeType = 'image/gif'",
  webp: "mimeType = 'image/webp'",
  svg: "mimeType = 'image/svg+xml'",
  bmp: "mimeType = 'image/bmp'",
  heic: "mimeType = 'image/heic'",
  // Videos
  video: "mimeType contains 'video/'",
  mp4: "mimeType = 'video/mp4'",
  avi: "mimeType = 'video/x-msvideo'",
  mov: "mimeType = 'video/quicktime'",
  mkv: "mimeType = 'video/x-matroska'",
  webm: "mimeType = 'video/webm'",
  wmv: "mimeType = 'video/x-ms-wmv'",
  // Audio
  audio: "mimeType contains 'audio/'",
  mp3: "mimeType = 'audio/mpeg'",
  wav: "mimeType = 'audio/wav'",
  ogg: "mimeType = 'audio/ogg'",
  flac: "mimeType = 'audio/flac'",
  aac: "mimeType = 'audio/aac'",
  m4a: "mimeType = 'audio/mp4'",
  // Documents / misc
  document:
    "(mimeType = 'application/pdf' or mimeType = 'application/msword' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain' or mimeType = 'text/csv' or mimeType = 'application/json')",
  pdf: "mimeType = 'application/pdf'",
  doc: "mimeType = 'application/msword'",
  docx: "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
  xls: "mimeType = 'application/vnd.ms-excel'",
  xlsx: "mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
  ppt: "mimeType = 'application/vnd.ms-powerpoint'",
  pptx: "mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'",
  txt: "mimeType = 'text/plain'",
  csv: "mimeType = 'text/csv'",
  json: "mimeType = 'application/json'",
  xml: "(mimeType = 'text/xml' or mimeType = 'application/xml')",
  zip: "(mimeType = 'application/zip' or mimeType = 'application/x-zip-compressed')",
};

const FILE_TYPE_OPTIONS = [
  { label: 'All types', value: 'all' },
  { label: 'Folders', value: 'folder' },
  {
    label: 'Google Docs',
    value: 'gdocs',
    children: [
      { label: 'Document', value: 'gdoc' },
      { label: 'Spreadsheet', value: 'gsheet' },
      { label: 'Presentation', value: 'gslide' },
      { label: 'Form', value: 'gform' },
    ],
  },
  {
    label: 'Images',
    value: 'image',
    children: [
      { label: 'JPEG (.jpg / .jpeg)', value: 'jpeg' },
      { label: 'PNG (.png)', value: 'png' },
      { label: 'GIF (.gif)', value: 'gif' },
      { label: 'WebP (.webp)', value: 'webp' },
      { label: 'SVG (.svg)', value: 'svg' },
      { label: 'BMP (.bmp)', value: 'bmp' },
      { label: 'HEIC (.heic)', value: 'heic' },
    ],
  },
  {
    label: 'Videos',
    value: 'video',
    children: [
      { label: 'MP4 (.mp4)', value: 'mp4' },
      { label: 'AVI (.avi)', value: 'avi' },
      { label: 'MOV (.mov)', value: 'mov' },
      { label: 'MKV (.mkv)', value: 'mkv' },
      { label: 'WebM (.webm)', value: 'webm' },
      { label: 'WMV (.wmv)', value: 'wmv' },
    ],
  },
  {
    label: 'Audio',
    value: 'audio',
    children: [
      { label: 'MP3 (.mp3)', value: 'mp3' },
      { label: 'WAV (.wav)', value: 'wav' },
      { label: 'OGG (.ogg)', value: 'ogg' },
      { label: 'FLAC (.flac)', value: 'flac' },
      { label: 'AAC (.aac)', value: 'aac' },
      { label: 'M4A (.m4a)', value: 'm4a' },
    ],
  },
  {
    label: 'Documents',
    value: 'document',
    children: [
      { label: 'PDF (.pdf)', value: 'pdf' },
      { label: 'Word (.doc)', value: 'doc' },
      { label: 'Word (.docx)', value: 'docx' },
      { label: 'Excel (.xls)', value: 'xls' },
      { label: 'Excel (.xlsx)', value: 'xlsx' },
      { label: 'PowerPoint (.ppt)', value: 'ppt' },
      { label: 'PowerPoint (.pptx)', value: 'pptx' },
      { label: 'Text (.txt)', value: 'txt' },
      { label: 'CSV (.csv)', value: 'csv' },
      { label: 'JSON (.json)', value: 'json' },
      { label: 'XML (.xml)', value: 'xml' },
      { label: 'ZIP (.zip)', value: 'zip' },
    ],
  },
];

const GoogleDrivePage: React.FC = () => {
  const { user, isSignedIn, accessToken, signIn, signOut } = useGoogleAuth();
  const { list, listSharedWithMe, search } = useDriveApi(accessToken);

  const [viewMode, setViewMode] = useState<ViewMode>('my-drive');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' },
  ]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const loadingRef = useRef(false);

  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>(['all']);

  // Action modals state
  const [renameFile, setRenameFile] = useState<DriveFile | null>(null);
  const [copyFile, setCopyFile] = useState<DriveFile | null>(null);
  const [shareFile, setShareFile] = useState<DriveFile | null>(null);
  const [moveFile, setMoveFile] = useState<DriveFile | null>(null);
  const [deleteFile, setDeleteFile] = useState<DriveFile | null>(null);

  const loadFiles = useCallback(
    async (folderId: string, token?: string, extraQ?: string) => {
      if (!isSignedIn || loadingRef.current) return;
      loadingRef.current = true;
      const isMore = !!token;
      if (isMore) setLoadingMore(true);
      else setInitialLoading(true);
      try {
        const res = await list(folderId, token, undefined, extraQ);
        setFiles((prev) => (isMore ? [...prev, ...res.files] : res.files));
        setNextPageToken(res.nextPageToken);
      } catch (e) {
        console.error(e);
      } finally {
        loadingRef.current = false;
        if (isMore) setLoadingMore(false);
        else setInitialLoading(false);
      }
    },
    [isSignedIn, list],
  );

  const loadSharedFiles = useCallback(
    async (token?: string, extraQ?: string) => {
      if (!isSignedIn || loadingRef.current) return;
      loadingRef.current = true;
      const isMore = !!token;
      if (isMore) setLoadingMore(true);
      else setInitialLoading(true);
      try {
        const res = await listSharedWithMe(token, undefined, extraQ);
        setFiles((prev) => (isMore ? [...prev, ...res.files] : res.files));
        setNextPageToken(res.nextPageToken);
      } catch (e) {
        console.error(e);
      } finally {
        loadingRef.current = false;
        if (isMore) setLoadingMore(false);
        else setInitialLoading(false);
      }
    },
    [isSignedIn, listSharedWithMe],
  );

  const loadSearchResults = useCallback(
    async (query: string, token?: string, extraQ?: string) => {
      if (!isSignedIn || loadingRef.current || !query.trim()) return;
      loadingRef.current = true;
      const isMore = !!token;
      if (isMore) setLoadingMore(true);
      else setInitialLoading(true);
      try {
        const res = await search(query.trim(), token, extraQ);
        setFiles((prev) => (isMore ? [...prev, ...res.files] : res.files));
        setNextPageToken(res.nextPageToken);
      } catch (e) {
        console.error(e);
      } finally {
        loadingRef.current = false;
        if (isMore) setLoadingMore(false);
        else setInitialLoading(false);
      }
    },
    [isSignedIn, search],
  );

  const filterQ = MIME_Q_MAP[fileTypeFilter[fileTypeFilter.length - 1] ?? 'all'] ?? '';

  const refreshCurrentView = () => {
    if (searchQuery.trim()) {
      loadSearchResults(searchQuery, undefined, filterQ);
    } else if (viewMode === 'shared') {
      loadSharedFiles(undefined, filterQ);
    } else {
      loadFiles(currentFolderId, undefined, filterQ);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      const q = MIME_Q_MAP[fileTypeFilter[fileTypeFilter.length - 1] ?? 'all'] ?? '';
      if (searchQuery.trim()) {
        loadSearchResults(searchQuery, undefined, q);
      } else if (viewMode === 'shared') {
        loadSharedFiles(undefined, q);
      } else {
        loadFiles(currentFolderId, undefined, q);
      }
    } else {
      setFiles([]);
    }
  }, [isSignedIn, currentFolderId, viewMode, fileTypeFilter]);

  const handleFolderClick = (folder: DriveFile) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    // When navigating into a shared folder, switch to my-drive browsing mode
    if (viewMode === 'shared') {
      setViewMode('my-drive');
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const handleViewChange = (value: string | number) => {
    const mode = value as ViewMode;
    setViewMode(mode);
    setSearchQuery('');
    if (mode === 'my-drive') {
      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'My Drive' }]);
    }
    setFiles([]);
    setNextPageToken(undefined);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFiles([]);
    setNextPageToken(undefined);
    if (value.trim()) {
      loadSearchResults(value, undefined, filterQ);
    } else {
      if (viewMode === 'shared') {
        loadSharedFiles(undefined, filterQ);
      } else {
        loadFiles(currentFolderId, undefined, filterQ);
      }
    }
  };

  const handleFileTypeChange = (value: string[]) => {
    setFileTypeFilter(value);
    setFiles([]);
    setNextPageToken(undefined);
  };

  const userMenu = (
    <Menu
      items={[{ key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', onClick: signOut }]}
    />
  );

  return (
    <PageContainer
      header={{
        title: 'Google Drive Manager',
        extra: [
          isSignedIn ? (
            <Space key="actions">
              <Button icon={<CloudUploadOutlined />} onClick={() => setShowUpload(true)}>
                Upload
              </Button>
              <Dropdown overlay={userMenu}>
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar src={user?.picture} icon={<GoogleOutlined />} />
                  <Typography.Text>{user?.name}</Typography.Text>
                </Space>
              </Dropdown>
            </Space>
          ) : (
            <Button key="login" type="primary" icon={<GoogleOutlined />} onClick={signIn}>
              Sign in with Google
            </Button>
          ),
        ],
      }}
    >
      <Card>
        {isSignedIn ? (
          <>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space style={{ justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
                <Segmented
                  value={viewMode}
                  onChange={handleViewChange}
                  options={[
                    { label: 'My Drive', value: 'my-drive', icon: <FolderOutlined /> },
                    { label: 'Shared with me', value: 'shared', icon: <TeamOutlined /> },
                  ]}
                />
                <Space>
                  <Cascader
                    options={FILE_TYPE_OPTIONS}
                    value={fileTypeFilter}
                    onChange={handleFileTypeChange}
                    changeOnSelect
                    allowClear={false}
                    showSearch
                    placeholder="All types"
                    style={{ width: 200 }}
                  />
                  <Input.Search
                    placeholder="Search files..."
                    allowClear
                    onSearch={handleSearch}
                    onChange={(e) => {
                      if (!e.target.value) handleSearch('');
                    }}
                    style={{ width: 250 }}
                  />
                  <Tooltip title="List view">
                    <Button
                      type={displayMode === 'list' ? 'primary' : 'default'}
                      icon={<UnorderedListOutlined />}
                      onClick={() => setDisplayMode('list')}
                    />
                  </Tooltip>
                  <Tooltip title="Grid view">
                    <Button
                      type={displayMode === 'grid' ? 'primary' : 'default'}
                      icon={<AppstoreOutlined />}
                      onClick={() => setDisplayMode('grid')}
                    />
                  </Tooltip>
                </Space>
              </Space>

              {viewMode === 'my-drive' && !searchQuery.trim() && (
                <Breadcrumb>
                  {folderPath.map((folder, index) => (
                    <Breadcrumb.Item
                      key={folder.id}
                      onClick={() => handleBreadcrumbClick(index)}
                      href="#"
                    >
                      {folder.name}
                    </Breadcrumb.Item>
                  ))}
                </Breadcrumb>
              )}

              <DriveList
                files={files}
                loading={initialLoading}
                loadingMore={loadingMore}
                displayMode={displayMode}
                onFolderClick={handleFolderClick}
                onPreview={(file) => setPreviewFile(file)}
                onDetail={(file) => setSelectedFile(file)}
                onLoadMore={() =>
                  searchQuery.trim()
                    ? loadSearchResults(searchQuery, nextPageToken, filterQ)
                    : viewMode === 'shared'
                      ? loadSharedFiles(nextPageToken, filterQ)
                      : loadFiles(currentFolderId, nextPageToken, filterQ)
                }
                hasMore={!!nextPageToken}
                onRename={(file) => setRenameFile(file)}
                onCopy={(file) => setCopyFile(file)}
                onShare={(file) => setShareFile(file)}
                onMove={(file) => setMoveFile(file)}
                onDelete={(file) => setDeleteFile(file)}
              />
            </Space>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <GoogleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Typography.Title level={4}>
              Please sign in to access your Google Drive
            </Typography.Title>
          </div>
        )}
      </Card>

      <DriveDetail
        file={selectedFile}
        visible={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        accessToken={accessToken}
      />

      <DrivePreview
        file={previewFile}
        visible={!!previewFile}
        onClose={() => setPreviewFile(null)}
        accessToken={accessToken}
      />

      <UploadControl
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        parentId={currentFolderId}
        accessToken={accessToken}
        onComplete={refreshCurrentView}
      />

      {/* File action modals */}
      <RenameModal
        file={renameFile}
        visible={!!renameFile}
        onClose={() => setRenameFile(null)}
        accessToken={accessToken}
        onSuccess={refreshCurrentView}
      />

      <CopyModal
        file={copyFile}
        visible={!!copyFile}
        onClose={() => setCopyFile(null)}
        accessToken={accessToken}
        onSuccess={refreshCurrentView}
      />

      <ShareModal
        file={shareFile}
        visible={!!shareFile}
        onClose={() => setShareFile(null)}
        accessToken={accessToken}
        onSuccess={refreshCurrentView}
      />

      <MoveModal
        file={moveFile}
        visible={!!moveFile}
        onClose={() => setMoveFile(null)}
        accessToken={accessToken}
        onSuccess={refreshCurrentView}
      />

      <DeleteConfirm
        file={deleteFile}
        visible={!!deleteFile}
        onClose={() => setDeleteFile(null)}
        accessToken={accessToken}
        onSuccess={() => {
          if (deleteFile) setFiles((prev) => prev.filter((f) => f.id !== deleteFile.id));
        }}
      />
    </PageContainer>
  );
};

export default GoogleDrivePage;
