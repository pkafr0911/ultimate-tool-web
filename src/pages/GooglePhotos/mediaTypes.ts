import { DriveFile } from '../GoogleDrive/types';
import { PhotosMediaItem } from './hooks/usePhotosApi';

/** Unified media item that can represent a Drive file or a Photos media item */
export interface MediaItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  /** Direct thumbnail URL (no auth fetch needed) */
  thumbnailUrl?: string;
  /** Full-resolution URL for display */
  fullUrl?: string;
  /** Drive file ID (for Drive API download) */
  driveFileId?: string;
  /** Source of this item */
  source: 'drive' | 'photos';
  /** Original item data */
  width?: number;
  height?: number;
  size?: string;
  ownerName?: string;
}

/** Convert DriveFile to MediaItem */
export function fromDriveFile(f: DriveFile): MediaItem {
  return {
    id: `drive-${f.id}`,
    name: f.name,
    mimeType: f.mimeType,
    createdTime: f.createdTime ?? f.modifiedTime,
    thumbnailUrl: f.thumbnailLink,
    driveFileId: f.id,
    source: 'drive',
    size: f.size,
    ownerName: f.owners?.[0]?.displayName,
  };
}

/** Convert PhotosMediaItem to MediaItem */
export function fromPhotosItem(p: PhotosMediaItem): MediaItem {
  const isVideo = p.mimeType.startsWith('video/');
  // For photos: baseUrl + =w{width}-h{height} gives the image
  // For videos: baseUrl + =dv gives the video stream
  return {
    id: `photos-${p.id}`,
    name: p.filename,
    mimeType: p.mimeType,
    createdTime: p.mediaMetadata.creationTime,
    thumbnailUrl: `${p.baseUrl}=w400-h400`,
    fullUrl: isVideo ? `${p.baseUrl}=dv` : `${p.baseUrl}=w2048-h2048`,
    source: 'photos',
    width: Number(p.mediaMetadata.width) || undefined,
    height: Number(p.mediaMetadata.height) || undefined,
  };
}
