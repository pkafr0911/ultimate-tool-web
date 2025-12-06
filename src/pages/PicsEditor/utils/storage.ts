import { EditorSettings, SavedProject } from '../types';

const DB_NAME = 'PicsEditorDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
    };
  });
};

export const saveProjectToDB = async (project: SavedProject): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving project');
  });
};

export const getAllProjectsFromDB = async (): Promise<SavedProject[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readonly');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = request.result as SavedProject[];
      // Sort by updatedAt desc
      projects.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(projects);
    };
    request.onerror = () => reject('Error fetching projects');
  });
};

export const deleteProjectFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error deleting project');
  });
};
