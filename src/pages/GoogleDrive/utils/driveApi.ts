import { DriveFile, DriveListResponse } from '../types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export const buildListQuery = (
  q: string = '',
  pageSize: number = 20,
  pageToken: string = '',
  orderBy: string = 'folder,name',
) => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields:
      'nextPageToken, files(id, name, mimeType, size, thumbnailLink, iconLink, createdTime, modifiedTime, parents, owners, capabilities, webViewLink, trashed)',
    orderBy,
    q: q || 'trashed = false',
  });
  if (pageToken) params.append('pageToken', pageToken);
  return params.toString();
};

export const listFiles = async (token: string, queryParams: string): Promise<DriveListResponse> => {
  const response = await fetch(`${DRIVE_API_BASE}/files?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Drive API List Error:', response.status, errorText);
    throw new Error(`Drive API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
};

export const getFileMetadata = async (token: string, fileId: string): Promise<DriveFile> => {
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,parents,owners,capabilities,webViewLink,thumbnailLink,iconLink`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error('Failed to fetch file metadata');
  return response.json();
};

export const downloadToBlob = async (token: string, fileId: string): Promise<Blob> => {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Download failed');
  return response.blob();
};

export const startResumableUpload = async (
  token: string,
  file: File,
  parentId?: string,
): Promise<string> => {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: parentId ? [parentId] : [],
  };

  const response = await fetch(`${UPLOAD_API_BASE}/files?uploadType=resumable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) throw new Error('Failed to start upload session');
  const location = response.headers.get('Location');
  if (!location) throw new Error('No upload location returned');
  return location;
};

export const uploadChunk = async (
  sessionUri: string,
  chunk: Blob,
  start: number,
  totalSize: number,
) => {
  const end = start + chunk.size - 1;
  const response = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
    },
    body: chunk,
  });

  // 308 Resume Incomplete is normal for chunks
  if (response.status !== 308 && !response.ok) {
    throw new Error('Chunk upload failed');
  }
  return response;
};

// ─── File Operations ────────────────────────────────────────────────

export const renameFile = async (
  token: string,
  fileId: string,
  newName: string,
): Promise<DriveFile> => {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) throw new Error('Failed to rename file');
  return response.json();
};

export const copyFile = async (
  token: string,
  fileId: string,
  newName?: string,
): Promise<DriveFile> => {
  const body: Record<string, any> = {};
  if (newName) body.name = newName;
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to copy file');
  return response.json();
};

export const trashFile = async (token: string, fileId: string): Promise<DriveFile> => {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trashed: true }),
  });
  if (!response.ok) throw new Error('Failed to move file to trash');
  return response.json();
};

export const moveFile = async (
  token: string,
  fileId: string,
  newParentId: string,
  oldParentIds: string[],
): Promise<DriveFile> => {
  const params = new URLSearchParams({
    addParents: newParentId,
    removeParents: oldParentIds.join(','),
  });
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error('Failed to move file');
  return response.json();
};

export interface Permission {
  role: 'reader' | 'writer' | 'commenter' | 'owner';
  type: 'user' | 'group' | 'domain' | 'anyone';
  emailAddress?: string;
}

export const shareFile = async (
  token: string,
  fileId: string,
  permission: Permission,
  sendNotificationEmail: boolean = true,
): Promise<any> => {
  const params = new URLSearchParams({
    sendNotificationEmail: sendNotificationEmail.toString(),
  });
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}/permissions?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permission),
    },
  );
  if (!response.ok) throw new Error('Failed to share file');
  return response.json();
};

export const listPermissions = async (
  token: string,
  fileId: string,
): Promise<{ permissions: any[] }> => {
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}/permissions?fields=permissions(id,role,type,emailAddress,displayName,photoLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) throw new Error('Failed to list permissions');
  return response.json();
};

export const deletePermission = async (
  token: string,
  fileId: string,
  permissionId: string,
): Promise<void> => {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions/${permissionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to remove permission');
};
