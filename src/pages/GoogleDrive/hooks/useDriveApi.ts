import { useCallback } from 'react';
import { message } from 'antd';
import {
  listFiles,
  getFileMetadata,
  downloadToBlob,
  startResumableUpload,
  uploadChunk,
  buildListQuery,
  renameFile as apiRename,
  copyFile as apiCopy,
  trashFile as apiTrash,
  moveFile as apiMove,
  shareFile as apiShare,
  listPermissions as apiListPermissions,
  deletePermission as apiDeletePermission,
  Permission,
} from '../utils/driveApi';
import { DriveFile, DriveListResponse } from '../types';

export const useDriveApi = (accessToken: string | null) => {
  const list = useCallback(
    async (folderId: string = 'root', pageToken?: string, orderBy?: string, extraQ?: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      const parts = [`'${folderId}' in parents`, 'trashed = false', extraQ].filter(Boolean);
      const q = parts.join(' and ');
      const query = buildListQuery(q, 20, pageToken, orderBy);
      return listFiles(accessToken, query);
    },
    [accessToken],
  );

  const listSharedWithMe = useCallback(
    async (pageToken?: string, orderBy?: string, extraQ?: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      const parts = ['sharedWithMe = true', 'trashed = false', extraQ].filter(Boolean);
      const q = parts.join(' and ');
      const query = buildListQuery(q, 20, pageToken, orderBy);
      return listFiles(accessToken, query);
    },
    [accessToken],
  );

  const search = useCallback(
    async (searchTerm: string, pageToken?: string, extraQ?: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      const escaped = searchTerm.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const parts = [`name contains '${escaped}'`, 'trashed = false', extraQ].filter(Boolean);
      const q = parts.join(' and ');
      const query = buildListQuery(q, 20, pageToken);
      return listFiles(accessToken, query);
    },
    [accessToken],
  );

  /** Raw query — pass a full Drive API `q` string. */
  const queryFiles = useCallback(
    async (q: string, pageSize: number = 50, pageToken?: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      const query = buildListQuery(q, pageSize, pageToken, 'createdTime desc');
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

  const rename = useCallback(
    async (fileId: string, newName: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const result = await apiRename(accessToken, fileId, newName);
        message.success('File renamed');
        return result;
      } catch (e) {
        message.error('Failed to rename file');
        console.error(e);
        throw e;
      }
    },
    [accessToken],
  );

  const copy = useCallback(
    async (fileId: string, newName?: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const result = await apiCopy(accessToken, fileId, newName);
        message.success('Copy created');
        return result;
      } catch (e) {
        message.error('Failed to copy file');
        console.error(e);
        throw e;
      }
    },
    [accessToken],
  );

  const trash = useCallback(
    async (fileId: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const result = await apiTrash(accessToken, fileId);
        message.success('Moved to trash');
        return result;
      } catch (e) {
        message.error('Failed to move to trash');
        console.error(e);
        throw e;
      }
    },
    [accessToken],
  );

  const move = useCallback(
    async (fileId: string, newParentId: string, oldParentIds: string[]) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const result = await apiMove(accessToken, fileId, newParentId, oldParentIds);
        message.success('File moved');
        return result;
      } catch (e) {
        message.error('Failed to move file');
        console.error(e);
        throw e;
      }
    },
    [accessToken],
  );

  const share = useCallback(
    async (fileId: string, permission: Permission, sendNotification: boolean = true) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        const result = await apiShare(accessToken, fileId, permission, sendNotification);
        message.success('File shared');
        return result;
      } catch (e) {
        message.error('Failed to share file');
        console.error(e);
        throw e;
      }
    },
    [accessToken],
  );

  const getPermissions = useCallback(
    async (fileId: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      return apiListPermissions(accessToken, fileId);
    },
    [accessToken],
  );

  const removePermission = useCallback(
    async (fileId: string, permissionId: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      try {
        await apiDeletePermission(accessToken, fileId, permissionId);
        message.success('Permission removed');
      } catch (e) {
        message.error('Failed to remove permission');
        console.error(e);
        throw e;
      }
    },
    [accessToken],
  );

  return {
    list,
    listSharedWithMe,
    search,
    queryFiles,
    getMetadata,
    download,
    upload,
    rename,
    copy,
    trash,
    move,
    share,
    getPermissions,
    removePermission,
  };
};
