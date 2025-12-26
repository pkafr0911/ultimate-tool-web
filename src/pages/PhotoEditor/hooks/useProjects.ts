import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { SavedProject } from '../types';
import { getAllProjectsFromDB, saveProjectToDB, deleteProjectFromDB } from '../utils/storage';

export const useProjects = () => {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);

  const loadProjects = useCallback(() => {
    getAllProjectsFromDB()
      .then(setSavedProjects)
      .catch((err) => console.error('Failed to load projects from DB', err));
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const saveProject = useCallback(
    async (preview: string, json: any) => {
      if (!preview) return;

      const newProject: SavedProject = {
        id: currentProject?.id || Date.now().toString(),
        name: currentProject?.name || `Project ${new Date().toLocaleString()}`,
        thumbnail: preview,
        json: json,
        createdAt: currentProject?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await saveProjectToDB(newProject);

        // Update local state
        setSavedProjects((prev) => {
          const exists = prev.some((p) => p.id === newProject.id);
          const updated = exists
            ? prev.map((p) => (p.id === newProject.id ? newProject : p))
            : [newProject, ...prev];

          // Sort by updatedAt desc
          return updated.sort((a, b) => b.updatedAt - a.updatedAt);
        });

        setCurrentProject(newProject);
        message.success('Project saved successfully!');
      } catch (err) {
        console.error(err);
        message.error('Failed to save project');
      }
    },
    [currentProject],
  );

  const deleteProject = useCallback(async (id: string) => {
    try {
      await deleteProjectFromDB(id);
      setSavedProjects((prev) => prev.filter((p) => p.id !== id));
      // If the deleted project is currently loaded, clear it so editor doesn't reference it
      setCurrentProject((cur) => (cur && cur.id === id ? null : cur));
      message.success('Project deleted');
    } catch (err) {
      console.error(err);
      message.error('Failed to delete project');
    }
  }, []);

  const loadProjectIntoEditor = useCallback((project: SavedProject) => {
    setCurrentProject(project);
  }, []);

  const clearCurrentProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  return {
    savedProjects,
    currentProject,
    loadProjects,
    saveProject,
    deleteProject,
    loadProjectIntoEditor,
    clearCurrentProject,
    setCurrentProject,
  };
};
