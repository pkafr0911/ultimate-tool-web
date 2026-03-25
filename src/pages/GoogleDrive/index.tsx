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
  Select,
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

const FILE_TYPE_OPTIONS = [
  { label: 'All types', value: 'all', q: '' },
  { label: 'Folders', value: 'folder', q: "mimeType = 'application/vnd.google-apps.folder'" },
  { label: 'Documents', value: 'document', q: "mimeType = 'application/vnd.google-apps.document'" },
  {
    label: 'Spreadsheets',
    value: 'spreadsheet',
    q: "mimeType = 'application/vnd.google-apps.spreadsheet'",
  },
  {
    label: 'Presentations',
    value: 'presentation',
    q: "mimeType = 'application/vnd.google-apps.presentation'",
  },
  { label: 'PDFs', value: 'pdf', q: "mimeType = 'application/pdf'" },
  { label: 'Images', value: 'image', q: "mimeType contains 'image/'" },
  { label: 'Videos', value: 'video', q: "mimeType contains 'video/'" },
  { label: 'Audio', value: 'audio', q: "mimeType contains 'audio/'" },
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
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

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

  const filterQ = FILE_TYPE_OPTIONS.find((o) => o.value === fileTypeFilter)?.q ?? '';

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
      const q = FILE_TYPE_OPTIONS.find((o) => o.value === fileTypeFilter)?.q ?? '';
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

  const handleFileTypeChange = (value: string) => {
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
                  <Select
                    value={fileTypeFilter}
                    onChange={handleFileTypeChange}
                    options={FILE_TYPE_OPTIONS}
                    style={{ width: 150 }}
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
