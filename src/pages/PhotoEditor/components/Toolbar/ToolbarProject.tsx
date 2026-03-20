import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button, Dropdown, Menu, Tooltip, Modal, Input, List, Spin, Empty, message } from 'antd';
import {
  FileImageOutlined,
  CopyOutlined,
  SnippetsOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  UploadOutlined,
  ExportOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { Canvas, FabricObject, ActiveSelection } from 'fabric';
import { photoEditorMessages } from '../../hooks/useNotification';
import ExportModal from '../ExportModal';
import ProjectModal from '../ProjectModal';
import { SavedProject } from '../../types';
import { getOrRequestToken } from '@/components/GoogleDrive/DriveButtons';

interface ToolbarProjectProps {
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
  clipboard: FabricObject | null;
  setClipboard: (obj: FabricObject | null) => void;
  saveState: () => void;
  savedProjects: SavedProject[];
  onSaveProject: () => void;
  onDeleteProject: (id: string) => void;
  onLoadProject: (project: SavedProject) => void;
  onNewProject: () => void;
  exportModalVisible: boolean;
  setExportModalVisible: (visible: boolean) => void;
  projectModalVisible: boolean;
  setProjectModalVisible: (visible: boolean) => void;
}

const ToolbarProject: React.FC<ToolbarProjectProps> = ({
  canvas,
  selectedObject,
  clipboard,
  setClipboard,
  saveState,
  savedProjects,
  onSaveProject,
  onDeleteProject,
  onLoadProject,
  onNewProject,
  exportModalVisible,
  setExportModalVisible,
  projectModalVisible,
  setProjectModalVisible,
}) => {
  const projectImportRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Drive state
  const [driveSaveVisible, setDriveSaveVisible] = useState(false);
  const [driveSaveName, setDriveSaveName] = useState('project.json');
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveLoadVisible, setDriveLoadVisible] = useState(false);
  const [driveFiles, setDriveFiles] = useState<
    { id: string; name: string; modifiedTime?: string }[]
  >([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveLoadingMore, setDriveLoadingMore] = useState(false);
  const [driveDownloading, setDriveDownloading] = useState<string | null>(null);
  const [driveNextPageToken, setDriveNextPageToken] = useState<string | undefined>();
  const [driveSearch, setDriveSearch] = useState('');
  const driveSentinelRef = useRef<HTMLDivElement>(null);
  const driveTokenRef = useRef<string | null>(null);

  const DRIVE_API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

  const handleDriveSave = async () => {
    if (!canvas) return;
    const token = await getOrRequestToken();
    if (!token) {
      message.error('Google sign-in is required to save to Drive');
      return;
    }
    setDriveSaving(true);
    try {
      const json = canvas.toJSON();
      const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
      const metadata = { name: driveSaveName || 'project.json', mimeType: 'application/json' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);
      const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      message.success(`Saved "${driveSaveName}" to Google Drive`);
      setDriveSaveVisible(false);
    } catch {
      message.error('Failed to save to Google Drive');
    } finally {
      setDriveSaving(false);
    }
  };

  const fetchDriveFiles = useCallback(
    async (token: string, pageToken?: string, searchQuery?: string) => {
      let q = "trashed=false and (mimeType='application/json')";
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
      return res.json() as Promise<{
        files: { id: string; name: string; modifiedTime?: string }[];
        nextPageToken?: string;
      }>;
    },
    [],
  );

  const openDriveLoad = useCallback(
    async (searchQuery?: string) => {
      const token = await getOrRequestToken();
      if (!token) {
        message.error('Google sign-in is required to access Drive');
        return;
      }
      driveTokenRef.current = token;
      setDriveLoadVisible(true);
      setDriveLoading(true);
      setDriveFiles([]);
      setDriveNextPageToken(undefined);
      try {
        const data = await fetchDriveFiles(token, undefined, searchQuery);
        setDriveFiles(data.files || []);
        setDriveNextPageToken(data.nextPageToken);
      } catch {
        message.error('Failed to list Drive files');
      } finally {
        setDriveLoading(false);
      }
    },
    [fetchDriveFiles],
  );

  const loadMoreDriveFiles = useCallback(async () => {
    if (!driveNextPageToken || driveLoadingMore || !driveTokenRef.current) return;
    setDriveLoadingMore(true);
    try {
      const data = await fetchDriveFiles(driveTokenRef.current, driveNextPageToken, driveSearch);
      setDriveFiles((prev) => [...prev, ...(data.files || [])]);
      setDriveNextPageToken(data.nextPageToken);
    } catch {
      message.error('Failed to load more files');
    } finally {
      setDriveLoadingMore(false);
    }
  }, [driveNextPageToken, driveLoadingMore, driveSearch, fetchDriveFiles]);

  useEffect(() => {
    if (!driveLoadVisible) return;
    const el = driveSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreDriveFiles();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [driveLoadVisible, loadMoreDriveFiles]);

  const handleDriveLoadFile = async (file: { id: string; name: string }) => {
    if (!canvas) return;
    const token = driveTokenRef.current;
    if (!token) return;
    setDriveDownloading(file.id);
    try {
      const res = await fetch(`${DRIVE_API}/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const text = await res.text();
      const json = JSON.parse(text);
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        saveState();
        photoEditorMessages.projectLoaded();
      });
      setDriveLoadVisible(false);
      message.success(`Loaded "${file.name}" from Drive`);
    } catch {
      message.error('Failed to load project from Drive');
    } finally {
      setDriveDownloading(null);
    }
  };

  const handleDriveSearch = (value: string) => {
    setDriveSearch(value);
    openDriveLoad(value);
  };

  const handleDriveLoadClose = () => {
    setDriveLoadVisible(false);
    setDriveSearch('');
    setDriveFiles([]);
    setDriveNextPageToken(undefined);
  };

  const copy = async () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const cloned = await activeObject.clone();
      setClipboard(cloned);
      photoEditorMessages.copied();
    }
  };

  const paste = async () => {
    if (!canvas || !clipboard) return;
    const clonedObj = await clipboard.clone();
    canvas.discardActiveObject();

    clonedObj.set({
      left: (clonedObj.left || 0) + 10,
      top: (clonedObj.top || 0) + 10,
      evented: true,
    });

    if (clonedObj instanceof ActiveSelection) {
      clonedObj.canvas = canvas;
      clonedObj.forEachObject((obj) => {
        canvas.add(obj);
      });
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }

    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
    saveState();
    photoEditorMessages.pasted();
  };

  const handleImportProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas) return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text);
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
          saveState();
          photoEditorMessages.projectLoaded();
        });
      } catch (err) {
        console.error('Failed to import project JSON', err);
        photoEditorMessages.projectImportFailed();
      }
    };
    reader.readAsText(file);
    e.currentTarget.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result as string;
      const { FabricImage } = await import('fabric');
      FabricImage.fromURL(data).then((img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.centerObject(img);
        canvas.setActiveObject(img);
        saveState();
        photoEditorMessages.imageAdded();
      });
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={imageUploadRef}
        hidden
        accept="image/*"
        onChange={handleImageUpload}
      />
      <input
        type="file"
        ref={projectImportRef}
        hidden
        accept="application/json, .json"
        onChange={handleImportProjectFile}
      />

      <Dropdown
        overlay={
          <Menu>
            <Menu.Item
              key="upload"
              icon={<FileImageOutlined />}
              onClick={() => imageUploadRef.current?.click()}
            >
              Upload Image
            </Menu.Item>
            <Menu.Item key="copy" icon={<CopyOutlined />} onClick={copy} disabled={!selectedObject}>
              Copy (Ctrl+C)
            </Menu.Item>
            <Menu.Item
              key="paste"
              icon={<SnippetsOutlined />}
              onClick={paste}
              disabled={!clipboard}
            >
              Paste (Ctrl+V)
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="new" icon={<FileImageOutlined />} onClick={onNewProject}>
              New Project (Ctrl+N)
            </Menu.Item>
            <Menu.Item key="save" icon={<SaveOutlined />} onClick={onSaveProject}>
              Save Project (Ctrl+S)
            </Menu.Item>
            <Menu.Item
              key="open"
              icon={<FolderOpenOutlined />}
              onClick={() => setProjectModalVisible(true)}
            >
              Open Projects
            </Menu.Item>
            <Menu.Item
              key="import"
              icon={<UploadOutlined />}
              onClick={() => projectImportRef.current?.click()}
            >
              Import Project (JSON)
            </Menu.Item>
            <Menu.Item
              key="export"
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              Export (Ctrl+Shift+S)
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              key="drive-save"
              icon={<CloudUploadOutlined />}
              onClick={() => {
                setDriveSaveName('project.json');
                setDriveSaveVisible(true);
              }}
            >
              Save to Google Drive
            </Menu.Item>
            <Menu.Item
              key="drive-load"
              icon={<CloudDownloadOutlined />}
              onClick={() => openDriveLoad(driveSearch)}
            >
              Load from Google Drive
            </Menu.Item>
          </Menu>
        }
        trigger={['click']}
      >
        <Tooltip title="More">
          <Button icon={<MoreOutlined />} />
        </Tooltip>
      </Dropdown>

      <ExportModal
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        canvas={canvas}
      />

      <ProjectModal
        visible={projectModalVisible}
        onCancel={() => setProjectModalVisible(false)}
        projects={savedProjects}
        onLoad={onLoadProject}
        onDelete={onDeleteProject}
      />

      <Modal
        title="Save to Google Drive"
        open={driveSaveVisible}
        onOk={handleDriveSave}
        onCancel={() => setDriveSaveVisible(false)}
        confirmLoading={driveSaving}
        okText="Save"
        destroyOnClose
      >
        <Input
          value={driveSaveName}
          onChange={(e) => setDriveSaveName(e.target.value)}
          placeholder="File name"
          addonBefore="Name"
          onPressEnter={handleDriveSave}
        />
      </Modal>

      <Modal
        title="Load from Google Drive"
        open={driveLoadVisible}
        onCancel={handleDriveLoadClose}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Input.Search
          placeholder="Search files..."
          allowClear
          onSearch={handleDriveSearch}
          style={{ marginBottom: 12 }}
          enterButton
        />
        {driveLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : driveFiles.length === 0 ? (
          <Empty description="No JSON project files found" />
        ) : (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <List
              dataSource={driveFiles}
              renderItem={(file) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDriveLoadFile(file)}
                  actions={[
                    <Button
                      key="load"
                      type="link"
                      size="small"
                      loading={driveDownloading === file.id}
                    >
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
            <div
              ref={driveSentinelRef}
              style={{ textAlign: 'center', padding: driveLoadingMore ? 12 : 1 }}
            >
              {driveLoadingMore && <Spin size="small" />}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ToolbarProject;
