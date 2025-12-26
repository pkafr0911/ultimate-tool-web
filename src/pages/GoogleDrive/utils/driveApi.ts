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
