import React, { useState, useEffect } from 'react';
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
} from 'antd';
import {
  GoogleOutlined,
  LogoutOutlined,
  FolderAddOutlined,
  CloudUploadOutlined,
  TeamOutlined,
  FolderOutlined,
} from '@ant-design/icons';
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

const GoogleDrivePage: React.FC = () => {
  const { user, isSignedIn, accessToken, signIn, signOut } = useGoogleAuth();
  const { list, listSharedWithMe } = useDriveApi(accessToken);

  const [viewMode, setViewMode] = useState<ViewMode>('my-drive');
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' },
  ]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);

  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Action modals state
  const [renameFile, setRenameFile] = useState<DriveFile | null>(null);
  const [copyFile, setCopyFile] = useState<DriveFile | null>(null);
  const [shareFile, setShareFile] = useState<DriveFile | null>(null);
  const [moveFile, setMoveFile] = useState<DriveFile | null>(null);
  const [deleteFile, setDeleteFile] = useState<DriveFile | null>(null);

  const loadFiles = async (folderId: string, token?: string) => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await list(folderId, token);
      setFiles(token ? [...files, ...res.files] : res.files);
      setNextPageToken(res.nextPageToken);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedFiles = async (token?: string) => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await listSharedWithMe(token);
      setFiles(token ? [...files, ...res.files] : res.files);
      setNextPageToken(res.nextPageToken);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentView = () => {
    if (viewMode === 'shared') {
      loadSharedFiles();
    } else {
      loadFiles(currentFolderId);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      if (viewMode === 'shared') {
        loadSharedFiles();
      } else {
        loadFiles(currentFolderId);
      }
    } else {
      setFiles([]);
    }
  }, [isSignedIn, currentFolderId, viewMode]);

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
    if (mode === 'my-drive') {
      setCurrentFolderId('root');
      setFolderPath([{ id: 'root', name: 'My Drive' }]);
    }
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
              <Segmented
                value={viewMode}
                onChange={handleViewChange}
                options={[
                  { label: 'My Drive', value: 'my-drive', icon: <FolderOutlined /> },
                  { label: 'Shared with me', value: 'shared', icon: <TeamOutlined /> },
                ]}
              />

              {viewMode === 'my-drive' && (
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
                loading={loading}
                onFolderClick={handleFolderClick}
                onPreview={(file) => setPreviewFile(file)}
                onDetail={(file) => setSelectedFile(file)}
                onLoadMore={() =>
                  viewMode === 'shared'
                    ? loadSharedFiles(nextPageToken)
                    : loadFiles(currentFolderId, nextPageToken)
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
        onSuccess={refreshCurrentView}
      />
    </PageContainer>
  );
};

export default GoogleDrivePage;
