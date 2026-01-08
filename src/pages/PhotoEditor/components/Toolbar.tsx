import React, { useEffect, useState, useRef } from 'react';
import { Button, Tooltip, Space, Divider, Dropdown, Menu } from 'antd';
import {
  DragOutlined,
  BorderOutlined,
  PlusCircleOutlined,
  FontSizeOutlined,
  FileImageOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
  HighlightOutlined,
  ExportOutlined,
  ScissorOutlined,
  BgColorsOutlined,
  CopyOutlined,
  SnippetsOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  AppstoreAddOutlined,
  UploadOutlined,
  ColumnWidthOutlined,
  BorderOuterOutlined,
} from '@ant-design/icons';
import {
  Rect,
  Circle,
  Triangle,
  Polygon,
  IText,
  FabricImage,
  ActiveSelection,
  Point,
} from 'fabric';
import { usePhotoEditor } from '../context';
import ExportModal from './ExportModal';
import LayerMaskModal from './LayerMaskModal';
import ProjectModal from './ProjectModal';
import CropModal from './CropModal';
import { useProjects } from '../hooks/useProjects';
import { applyMaskToFabricObject } from '../utils/effectsHelpers';
import IconFont from '@/components/IconFont';
import CameraRawModal from './CameraRaw/CameraRawModal';

const Toolbar: React.FC = () => {
  const { canvas, setActiveTool, activeTool, history, selectedObject, clipboard, setClipboard } =
    usePhotoEditor();
  const prevToolRef = useRef<string | null>(null);
  const spacePressedRef = useRef(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [maskModalVisible, setMaskModalVisible] = useState(false);
  const [cameraRawVisible, setCameraRawVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);

  const {
    savedProjects,
    saveProject,
    deleteProject,
    loadProjects,
    loadProjectIntoEditor,
    clearCurrentProject,
  } = useProjects();

  const handleSaveProject = () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    const preview = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
    saveProject(preview, json);
  };

  const handleLoadProject = (project: any) => {
    if (!canvas) return;
    canvas.loadFromJSON(project.json).then(() => {
      canvas.renderAll();
      // mark the project as current so saving will overwrite
      loadProjectIntoEditor(project);
      setProjectModalVisible(false);
      history.saveState();
    });
  };

  const newProject = () => {
    if (!canvas) return;
    // clear canvas and reset state
    canvas.discardActiveObject();
    canvas.clear();
    // ensure any background or options are reset if needed (left minimal)
    history.saveState();
    clearCurrentProject();
  };

  const copy = async () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const cloned = await activeObject.clone();
      setClipboard(cloned);
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
      // active selection needs a reference to the canvas.
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
    history.saveState();
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
          history.saveState();
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to import project JSON', err);
        // message could be used but importing antd here would duplicate import; use alert as fallback
        // If you prefer antd message, we can import it at top.
        alert('Failed to import project file. Make sure it is a valid project JSON.');
      }
    };
    reader.readAsText(file);
    // reset input so same file can be re-imported if needed
    e.currentTarget.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Ignore if editing text on canvas
      if (
        canvas?.getActiveObject() instanceof IText &&
        (canvas.getActiveObject() as IText).isEditing
      ) {
        return;
      }

      // Hold Space to temporarily switch to Hand tool
      if (e.code === 'Space') {
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
          prevToolRef.current = activeTool;
          if (activeTool !== 'hand') setActiveTool('hand');
        }
        e.preventDefault();
        return;
      }

      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'h' || e.key === 'H') setActiveTool('hand');
      if (e.key === 'b' || e.key === 'B') setActiveTool('brush');
      if (e.key === 'c' || e.key === 'C') {
        if (!(e.ctrlKey || e.metaKey)) {
          setCropModalVisible(true);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        if (selectedObject instanceof FabricImage) setMaskModalVisible(true);
      }
      if (e.key === 'r' || e.key === 'R') addRectangle();
      if (e.key === 't' || e.key === 'T') setActiveTool('text');

      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        history.redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copy();
      }

      // Paste handled by 'paste' event listener below to support image pasting
      // if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      //   e.preventDefault();
      //   paste();
      // }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setExportModalVisible(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        newProject();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spacePressedRef.current) {
        spacePressedRef.current = false;
        const prev = prevToolRef.current;
        prevToolRef.current = null;
        if (prev && prev !== 'hand') {
          setActiveTool(prev);
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas, selectedObject, history, activeTool, clipboard]);

  // Handle Paste (System Image vs Internal Object)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Check for images in system clipboard
      const items = e.clipboardData?.items;
      const hasImage = items && Array.from(items).some((item) => item.type.includes('image'));

      if (hasImage) {
        // Let the global paste handler (in useImageUpload) handle the image
        return;
      }

      // If no image, try to paste internal object
      if (clipboard) {
        e.preventDefault();
        paste();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [clipboard, canvas, history]);

  // Hand/pan tool: enable panning the canvas by dragging when activeTool === 'hand'
  useEffect(() => {
    if (!canvas) return;

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const startPan = (opt: any) => {
      if (activeTool !== 'hand') return;
      isPanning = true;
      const e = opt.e as MouseEvent;
      lastX = e.clientX;
      lastY = e.clientY;
      // discard selection and prevent object events while panning
      try {
        canvas.discardActiveObject();
      } catch (e) {
        // ignore
      }
      canvas.requestRenderAll();
      canvas.defaultCursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      canvas.forEachObject((o) => (o.evented = false));
    };

    const movePan = (opt: any) => {
      if (!isPanning || activeTool !== 'hand') return;
      const e = opt.e as MouseEvent;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // fabric expects a Point instance
      canvas.relativePan(new Point(dx, dy));
      canvas.requestRenderAll();
    };

    const endPan = () => {
      if (!isPanning) return;
      isPanning = false;
      canvas.defaultCursor = 'default';
      document.body.style.cursor = 'default';
      canvas.forEachObject((o) => (o.evented = true));
    };

    canvas.on('mouse:down', startPan);
    canvas.on('mouse:move', movePan);
    canvas.on('mouse:up', endPan);

    // Ensure cleanup and restore state when tool changes or unmount
    return () => {
      canvas.off('mouse:down', startPan);
      canvas.off('mouse:move', movePan);
      canvas.off('mouse:up', endPan);
      try {
        canvas.forEachObject((o) => (o.evented = true));
      } catch (e) {
        // ignore
      }
      canvas.defaultCursor = 'default';
      document.body.style.cursor = 'default';
    };
  }, [canvas, activeTool]);

  const addRectangle = () => {
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: '#ff0000',
      width: 100,
      height: 100,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    history.saveState();
  };

  const addCircle = () => {
    if (!canvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: '#00ff00',
      radius: 50,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    history.saveState();
  };

  const addTriangle = () => {
    if (!canvas) return;
    const triangle = new Triangle({
      left: 100,
      top: 100,
      fill: '#0000ff',
      width: 100,
      height: 100,
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    history.saveState();
  };

  const addPolygon = () => {
    if (!canvas) return;
    const points = [
      { x: 200, y: 100 },
      { x: 250, y: 125 },
      { x: 250, y: 175 },
      { x: 200, y: 200 },
      { x: 150, y: 175 },
      { x: 150, y: 125 },
    ];
    const polygon = new Polygon(points, {
      left: 100,
      top: 100,
      fill: '#ffff00',
      objectCaching: false,
    });
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    history.saveState();
  };

  const addText = () => {
    if (!canvas) return;
    const text = new IText('Text', {
      left: 100,
      top: 100,
      fontSize: 24,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setActiveTool('text');
    history.saveState();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      FabricImage.fromURL(data).then((img) => {
        img.scaleToWidth(200);
        canvas.add(img);
        canvas.centerObject(img);
        canvas.setActiveObject(img);
        history.saveState();
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      history.saveState();
    }
  };

  const handleApplyMask = (maskCanvas: HTMLCanvasElement) => {
    if (!canvas || !selectedObject) return;
    applyMaskToFabricObject(canvas, selectedObject, maskCanvas);
    history.saveState();
    setMaskModalVisible(false);
  };

  const handleApplyCameraRaw = (processedCanvas: HTMLCanvasElement) => {
    if (!canvas || !selectedObject || !(selectedObject instanceof FabricImage)) return;

    const newImg = new FabricImage(processedCanvas);

    // Copy properties
    newImg.set({
      left: selectedObject.left,
      top: selectedObject.top,
      scaleX: selectedObject.scaleX,
      scaleY: selectedObject.scaleY,
      angle: selectedObject.angle,
      skewX: selectedObject.skewX,
      skewY: selectedObject.skewY,
      flipX: selectedObject.flipX,
      flipY: selectedObject.flipY,
      originX: selectedObject.originX,
      originY: selectedObject.originY,
      opacity: selectedObject.opacity,
    });

    // Replace in canvas
    const index = canvas.getObjects().indexOf(selectedObject);
    canvas.discardActiveObject();
    canvas.remove(selectedObject);
    canvas.add(newImg);
    canvas.moveObjectTo(newImg, index);

    canvas.setActiveObject(newImg);
    canvas.requestRenderAll();
    history.saveState();
    setCameraRawVisible(false);
  };

  const getSelectedImageCanvas = (): HTMLCanvasElement | null => {
    if (!selectedObject || !(selectedObject instanceof FabricImage)) return null;
    const imgElement = selectedObject.getElement() as HTMLImageElement | HTMLCanvasElement;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgElement.width;
    tempCanvas.height = imgElement.height;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imgElement, 0, 0);
    }
    return tempCanvas;
  };

  const isImageSelected = selectedObject instanceof FabricImage;

  return (
    <Space direction="vertical" style={{ padding: '8px' }}>
      <Tooltip title="Hand (H)">
        <Button
          type={activeTool === 'hand' ? 'primary' : 'default'}
          icon={<IconFont name="iconhand" styles={{ height: 16, width: 16 }} />}
          onClick={() => setActiveTool('hand')}
        />
      </Tooltip>
      <Tooltip title="Select (V)">
        <Button
          type={activeTool === 'select' ? 'primary' : 'default'}
          icon={<DragOutlined />}
          onClick={() => setActiveTool('select')}
        />
      </Tooltip>
      <Tooltip title="Brush (B)">
        <Button
          type={activeTool === 'brush' ? 'primary' : 'default'}
          icon={<HighlightOutlined />}
          onClick={() => setActiveTool('brush')}
        />
      </Tooltip>

      <Dropdown
        overlay={
          <Menu>
            <Menu.Item key="rect" icon={<BorderOutlined />} onClick={addRectangle}>
              Rectangle
            </Menu.Item>
            <Menu.Item key="circle" icon={<PlusCircleOutlined />} onClick={addCircle}>
              Circle
            </Menu.Item>
            <Menu.Item key="triangle" icon={<BorderOutlined />} onClick={addTriangle}>
              Triangle
            </Menu.Item>
            <Menu.Item key="polygon" icon={<BorderOutlined />} onClick={addPolygon}>
              Polygon
            </Menu.Item>
          </Menu>
        }
        trigger={['click']}
      >
        <Tooltip title="Shapes">
          <Button icon={<AppstoreAddOutlined />} />
        </Tooltip>
      </Dropdown>

      <Tooltip title="Text (T)">
        <Button
          type={activeTool === 'text' ? 'primary' : 'default'}
          icon={<FontSizeOutlined />}
          onClick={() => setActiveTool('text')}
        />
      </Tooltip>

      <input type="file" id="image-upload" hidden accept="image/*" onChange={handleImageUpload} />
      <input
        type="file"
        id="project-import"
        hidden
        accept="application/json, .json"
        onChange={handleImportProjectFile}
      />

      <Divider style={{ margin: '8px 0' }} />

      <Tooltip title="Crop (C)">
        <Button icon={<BorderOuterOutlined />} onClick={() => setCropModalVisible(true)} />
      </Tooltip>
      <Tooltip title="Mask (M)">
        <Button
          icon={<ScissorOutlined />}
          onClick={() => setMaskModalVisible(true)}
          disabled={!isImageSelected}
        />
      </Tooltip>
      <Tooltip title="Camera Raw Filter">
        <Button
          icon={<BgColorsOutlined />}
          onClick={() => setCameraRawVisible(true)}
          disabled={!isImageSelected}
        />
      </Tooltip>

      <Divider style={{ margin: '8px 0' }} />

      <Tooltip title="Undo (Ctrl+Z)">
        <Button icon={<UndoOutlined />} onClick={history.undo} disabled={!history.canUndo} />
      </Tooltip>
      <Tooltip title="Redo (Ctrl+Y)">
        <Button icon={<RedoOutlined />} onClick={history.redo} disabled={!history.canRedo} />
      </Tooltip>

      <Divider style={{ margin: '8px 0' }} />

      <Dropdown
        overlay={
          <Menu>
            <Menu.Item
              key="upload"
              icon={<FileImageOutlined />}
              onClick={() => document.getElementById('image-upload')?.click()}
            >
              Upload Image
            </Menu.Item>
            <Menu.Item key="copy" icon={<CopyOutlined />} onClick={copy} disabled={!selectedObject}>
              Copy (Ctrl + C)
            </Menu.Item>
            <Menu.Item
              key="paste"
              icon={<SnippetsOutlined />}
              onClick={paste}
              disabled={!clipboard}
            >
              Paste (Ctrl + V)
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="new" icon={<FileImageOutlined />} onClick={newProject}>
              New Project (Ctrl + N)
            </Menu.Item>
            <Menu.Item key="save" icon={<SaveOutlined />} onClick={handleSaveProject}>
              Save Project (Ctrl + S)
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
              onClick={() => document.getElementById('project-import')?.click()}
            >
              Import Project (JSON)
            </Menu.Item>
            <Menu.Item
              key="export"
              icon={<ExportOutlined />}
              onClick={() => setExportModalVisible(true)}
            >
              Export (Ctrl + Shift + S)
            </Menu.Item>
          </Menu>
        }
        trigger={['click']}
      >
        <Tooltip title="More">
          <Button icon={<MoreOutlined />}></Button>
        </Tooltip>
      </Dropdown>

      <ExportModal
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        canvas={canvas}
      />

      {maskModalVisible && isImageSelected && (
        <LayerMaskModal
          open={maskModalVisible}
          onCancel={() => setMaskModalVisible(false)}
          onApply={handleApplyMask}
          sourceCanvas={getSelectedImageCanvas()}
          selectedColor={null}
        />
      )}

      {cameraRawVisible && isImageSelected && (
        <CameraRawModal
          visible={cameraRawVisible}
          onCancel={() => setCameraRawVisible(false)}
          onApply={handleApplyCameraRaw}
          sourceCanvas={getSelectedImageCanvas()}
        />
      )}

      <ProjectModal
        visible={projectModalVisible}
        onCancel={() => setProjectModalVisible(false)}
        projects={savedProjects}
        onLoad={handleLoadProject}
        onDelete={deleteProject}
      />

      {cropModalVisible && (
        <CropModal
          visible={cropModalVisible}
          onCancel={() => setCropModalVisible(false)}
          canvas={canvas}
          history={history}
        />
      )}
    </Space>
  );
};

export default Toolbar;
