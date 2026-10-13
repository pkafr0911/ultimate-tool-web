import React, { useEffect, useRef, useState } from 'react';
import { Space, Divider, message } from 'antd';
import { IText, FabricImage, Point, Rect } from 'fabric';
import { serializeDocument, renderDocument, loadDocument, documentSize, setDocumentSize, isTypingTarget, isEditable, isDocumentLoading } from '../../utils/document';
import { usePhotoEditor } from '../../context';
import { useProjects } from '../../hooks/useProjects';
import { photoEditorMessages } from '../../hooks/useNotification';
import ToolbarBrushTools from './ToolbarBrushTools';
import ToolbarShapes from './ToolbarShapes';
import ToolbarFilters from './ToolbarFilters';
import ToolbarHistory from './ToolbarHistory';
import ToolbarProject from './ToolbarProject';

const Toolbar: React.FC = () => {
  const { canvas, isBusy, initialProject, setActiveTool, activeTool, history, selectedObject, clipboard, setClipboard } =
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

  const { savedProjects, saveProject, deleteProject, loadProjectIntoEditor, clearCurrentProject, setCurrentProject } =
    useProjects();

  useEffect(() => { if (initialProject) setCurrentProject(initialProject); }, [initialProject]);

  const handleSaveProject = () => {
    if (!canvas) return;
    const json = serializeDocument(canvas);
    const preview = renderDocument(canvas, Math.min(1, 256 / Math.max(json.documentWidth, json.documentHeight))).toDataURL();
    saveProject(preview, json);

  };

  const handleLoadProject = (project: any) => {
    if (!canvas) return;
    loadDocument(canvas, project.json).then(() => {
      canvas.renderAll();
      loadProjectIntoEditor(project);
      setProjectModalVisible(false);
      history.saveState();
      photoEditorMessages.projectLoaded();
    }).catch(() => message.error('Unable to load project'));
  };

  const newProject = () => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.clear();
    const size = documentSize(canvas);
    setDocumentSize(canvas, size.width, size.height);
    history.saveState();
    clearCurrentProject();
    photoEditorMessages.canvasCleared();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBusy || isTypingTarget(e.target) || (e.target as HTMLElement)?.closest('.ant-modal') || (canvas && isDocumentLoading(canvas))) return;
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

      const plain = !e.ctrlKey && !e.metaKey && !e.altKey;
      if (plain && (e.key === 'v' || e.key === 'V')) setActiveTool('select');
      if (plain && (e.key === 'h' || e.key === 'H')) setActiveTool('hand');
      if (plain && (e.key === 'b' || e.key === 'B')) setActiveTool('brush');
      if (e.key === 'c' || e.key === 'C') {
        if (!(e.ctrlKey || e.metaKey)) {
          setCropModalVisible(true);
        }
      }
      if (plain && (e.key === 'm' || e.key === 'M')) {
        if (selectedObject instanceof FabricImage) setMaskModalVisible(true);
      }
      if (plain && e.key.toLowerCase() === 'r' && canvas) { const rect = new Rect({ left: 100, top: 100, width: 100, height: 100, fill: '#ff0000' }); canvas.add(rect); canvas.setActiveObject(rect); history.saveState(); }
      if (plain && (e.key === 't' || e.key === 'T')) setActiveTool('text');

      if (e.key === 'Escape') { canvas?.discardActiveObject(); setActiveTool('select'); canvas?.requestRenderAll(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects().filter(isEditable);
        if (activeObjects.length) {
          e.preventDefault();
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

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
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

    const resetPan = () => { if (spacePressedRef.current) { spacePressedRef.current = false; setActiveTool(prevToolRef.current || 'select'); prevToolRef.current = null; } };
    window.addEventListener('blur', resetPan);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('blur', resetPan);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvas, isBusy, selectedObject, history, activeTool, clipboard]);

  // Hand/pan tool effect
  useEffect(() => {
    if (!canvas) return;

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const startPan = (opt: any) => {
      if (activeTool !== 'hand') return;
      isPanning = true;
      const point = canvas.getViewportPoint(opt.e);
      lastX = point.x;
      lastY = point.y;
      try {
        canvas.discardActiveObject();
      } catch (err) {
        // ignore
      }
      canvas.requestRenderAll();
      canvas.defaultCursor = 'grabbing';
      document.body.style.cursor = 'grabbing';

    };

    const movePan = (opt: any) => {
      if (!isPanning || activeTool !== 'hand') return;
      const point = canvas.getViewportPoint(opt.e);
      const dx = point.x - lastX;
      const dy = point.y - lastY;
      lastX = point.x;
      lastY = point.y;
      canvas.relativePan(new Point(dx, dy));
      canvas.requestRenderAll();
    };

    const endPan = () => {
      if (!isPanning) return;
      isPanning = false;
      canvas.defaultCursor = 'default';
      document.body.style.cursor = 'default';

    };

    canvas.on('mouse:down', startPan);
    canvas.on('mouse:move', movePan);
    canvas.on('mouse:up', endPan);

    return () => {
      canvas.off('mouse:down', startPan);
      canvas.off('mouse:move', movePan);
      canvas.off('mouse:up', endPan);
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
