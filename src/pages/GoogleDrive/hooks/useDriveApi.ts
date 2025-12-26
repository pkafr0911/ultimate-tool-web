import { useCallback } from 'react';
import { message } from 'antd';
import {
  listFiles,
  getFileMetadata,
  downloadToBlob,
  startResumableUpload,
  uploadChunk,
  buildListQuery,
} from '../utils/driveApi';
import { DriveFile, DriveListResponse } from '../types';

export const useDriveApi = (accessToken: string | null) => {
  const list = useCallback(
    async (folderId: string = 'root', pageToken?: string, orderBy?: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      const q = `'${folderId}' in parents and trashed = false`;
      const query = buildListQuery(q, 20, pageToken, orderBy);
      return listFiles(accessToken, query);
    },
    [accessToken],
  );

  const getMetadata = useCallback(
    async (fileId: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      return getFileMetadata(accessToken, fileId);
    },
    [accessToken],
  );

  const download = useCallback(
    async (fileId: string, fileName: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const blob = await downloadToBlob(accessToken, fileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (e) {
        message.error('Download failed');
        console.error(e);
      }
    },
    [accessToken],
  );

  const upload = useCallback(
    async (file: File, parentId: string = 'root', onProgress?: (percent: number) => void) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const sessionUri = await startResumableUpload(accessToken, file, parentId);
        const CHUNK_SIZE = 256 * 1024; // 256KB chunks
        let start = 0;
        const total = file.size;

        while (start < total) {
          const chunk = file.slice(start, start + CHUNK_SIZE);
          await uploadChunk(sessionUri, chunk, start, total);
          start += chunk.size;
          if (onProgress) onProgress(Math.round((start / total) * 100));
        }
        message.success('Upload complete');
      } catch (e) {
        message.error('Upload failed');
        console.error(e);
      }
    },
    [accessToken],
  );

  return {
    list,
    getMetadata,
    download,
    upload,
  };
};
