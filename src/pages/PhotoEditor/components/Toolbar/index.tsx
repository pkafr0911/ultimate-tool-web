import React, { useEffect, useRef, useState } from 'react';
import { Space, Divider } from 'antd';
import { IText, FabricImage, Point } from 'fabric';
import { usePhotoEditor } from '../../context';
import { useProjects } from '../../hooks/useProjects';
import { photoEditorMessages } from '../../hooks/useNotification';
import ToolbarBrushTools from './ToolbarBrushTools';
import ToolbarShapes from './ToolbarShapes';
import ToolbarFilters from './ToolbarFilters';
import ToolbarHistory from './ToolbarHistory';
import ToolbarProject from './ToolbarProject';

const Toolbar: React.FC = () => {
  const { canvas, setActiveTool, activeTool, history, selectedObject, clipboard, setClipboard } =
    usePhotoEditor();
  const prevToolRef = useRef<string | null>(null);
  const spacePressedRef = useRef(false);

  // Modal visibility states
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [maskModalVisible, setMaskModalVisible] = useState(false);
  const [cameraRawVisible, setCameraRawVisible] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [blurBrushVisible, setBlurBrushVisible] = useState(false);

  const { savedProjects, saveProject, deleteProject, loadProjectIntoEditor, clearCurrentProject } =
    useProjects();

  const handleSaveProject = () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    const preview = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
    saveProject(preview, json);
    photoEditorMessages.projectSaved();
  };

  const handleLoadProject = (project: any) => {
    if (!canvas) return;
    canvas.loadFromJSON(project.json).then(() => {
      canvas.renderAll();
      loadProjectIntoEditor(project);
      setProjectModalVisible(false);
      history.saveState();
      photoEditorMessages.projectLoaded();
    });
  };

  const newProject = () => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.clear();
    history.saveState();
    clearCurrentProject();
    photoEditorMessages.canvasCleared();
  };

  // Keyboard shortcuts
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
      if (e.key === 't' || e.key === 'T') setActiveTool('text');

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
          canvas.discardActiveObject();
          activeObjects.forEach((obj) => {
            canvas.remove(obj);
          });
          history.saveState();
        }
      }

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

  // Hand/pan tool effect
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
      try {
        canvas.discardActiveObject();
      } catch (err) {
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

    return () => {
      canvas.off('mouse:down', startPan);
      canvas.off('mouse:move', movePan);
      canvas.off('mouse:up', endPan);
      try {
        canvas.forEachObject((o) => (o.evented = true));
      } catch (err) {
        // ignore
      }
      canvas.defaultCursor = 'default';
      document.body.style.cursor = 'default';
    };
  }, [canvas, activeTool]);

  return (
    <Space direction="vertical" style={{ padding: '8px' }}>
      <ToolbarBrushTools activeTool={activeTool} setActiveTool={setActiveTool} />

      <ToolbarShapes
        canvas={canvas}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        saveState={history.saveState}
      />

      <ToolbarFilters
        canvas={canvas}
        selectedObject={selectedObject}
        saveState={history.saveState}
        history={history}
        maskModalVisible={maskModalVisible}
        setMaskModalVisible={setMaskModalVisible}
        cameraRawVisible={cameraRawVisible}
        setCameraRawVisible={setCameraRawVisible}
        cropModalVisible={cropModalVisible}
        setCropModalVisible={setCropModalVisible}
        blurBrushVisible={blurBrushVisible}
        setBlurBrushVisible={setBlurBrushVisible}
      />

      <ToolbarHistory history={history} />

      <Divider style={{ margin: '8px 0' }} />

      <ToolbarProject
        canvas={canvas}
        selectedObject={selectedObject}
        clipboard={clipboard}
        setClipboard={setClipboard}
        saveState={history.saveState}
        savedProjects={savedProjects}
        onSaveProject={handleSaveProject}
        onDeleteProject={deleteProject}
        onLoadProject={handleLoadProject}
        onNewProject={newProject}
        exportModalVisible={exportModalVisible}
        setExportModalVisible={setExportModalVisible}
        projectModalVisible={projectModalVisible}
        setProjectModalVisible={setProjectModalVisible}
      />
    </Space>
  );
};

export default Toolbar;
