import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Space, Breadcrumb, Avatar, Dropdown, Menu, Typography } from 'antd';
import {
  GoogleOutlined,
  LogoutOutlined,
  FolderAddOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useDriveApi } from './hooks/useDriveApi';
import DriveList from './DriveList';
import DriveDetail from './DriveDetail';
import DrivePreview from './DrivePreview';
import UploadControl from './components/UploadControl';
import { DriveFile } from './types';

const GoogleDrivePage: React.FC = () => {
  const { user, isSignedIn, accessToken, signIn, signOut } = useGoogleAuth();
  const { list } = useDriveApi(accessToken);

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

  useEffect(() => {
    if (isSignedIn) {
      loadFiles(currentFolderId);
    } else {
      setFiles([]);
    }
  }, [isSignedIn, currentFolderId]);

  const handleFolderClick = (folder: DriveFile) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
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
            <Breadcrumb style={{ marginBottom: 16 }}>
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

            <DriveList
              files={files}
              loading={loading}
              onFolderClick={handleFolderClick}
              onPreview={(file) => setPreviewFile(file)}
              onDetail={(file) => setSelectedFile(file)}
              onLoadMore={() => loadFiles(currentFolderId, nextPageToken)}
              hasMore={!!nextPageToken}
            />
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
        onComplete={() => loadFiles(currentFolderId)}
      />
    </PageContainer>
  );
};

export default GoogleDrivePage;
