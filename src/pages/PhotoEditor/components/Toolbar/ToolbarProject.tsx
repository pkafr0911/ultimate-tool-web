import React, { useRef } from 'react';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import {
  FileImageOutlined,
  CopyOutlined,
  SnippetsOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  UploadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { Canvas, FabricObject, ActiveSelection } from 'fabric';
import { photoEditorMessages } from '../../hooks/useNotification';
import ExportModal from '../ExportModal';
import ProjectModal from '../ProjectModal';
import { SavedProject } from '../../types';

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
    </>
  );
};

export default ToolbarProject;
