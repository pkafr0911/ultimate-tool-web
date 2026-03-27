import { useCallback } from 'react';

const PHOTOS_API = 'https://photoslibrary.googleapis.com/v1';

export interface PhotosMediaItem {
  id: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
    };
    video?: {
      fps: number;
      status: string;
    };
  };
}

export interface PhotosListResponse {
  mediaItems: PhotosMediaItem[];
  nextPageToken?: string;
}

export interface PhotosSearchFilters {
  dateFilter?: {
    ranges: {
      startDate: { year: number; month: number; day: number };
      endDate: { year: number; month: number; day: number };
    }[];
  };
  mediaTypeFilter?: {
    mediaTypes: ('ALL_MEDIA' | 'PHOTO' | 'VIDEO')[];
  };
}

export const usePhotosApi = (accessToken: string | null) => {
  /** List media items (no search filters) */
  const listMediaItems = useCallback(
    async (pageSize: number = 50, pageToken?: string): Promise<PhotosListResponse> => {
      if (!accessToken) throw new Error('Not authenticated');

      const params = new URLSearchParams({ pageSize: pageSize.toString() });
      if (pageToken) params.set('pageToken', pageToken);

      const res = await fetch(`${PHOTOS_API}/mediaItems?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Photos API error: ${res.status} - ${text}`);
      }

      const data = await res.json();
      return {
        mediaItems: data.mediaItems || [],
        nextPageToken: data.nextPageToken,
      };
    },
    [accessToken],
  );

  /** Search media items with filters (date, media type) */
  const searchMediaItems = useCallback(
    async (
      filters?: PhotosSearchFilters,
      pageSize: number = 50,
      pageToken?: string,
    ): Promise<PhotosListResponse> => {
      if (!accessToken) throw new Error('Not authenticated');

      const body: any = { pageSize };
      if (pageToken) body.pageToken = pageToken;
      if (filters) body.filters = filters;

      const res = await fetch(`${PHOTOS_API}/mediaItems:search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Photos API error: ${res.status} - ${text}`);
      }

      const data = await res.json();
      return {
        mediaItems: data.mediaItems || [],
        nextPageToken: data.nextPageToken,
      };
    },
    [accessToken],
  );

  /** Get a single media item */
  const getMediaItem = useCallback(
    async (mediaItemId: string): Promise<PhotosMediaItem> => {
      if (!accessToken) throw new Error('Not authenticated');
      const res = await fetch(`${PHOTOS_API}/mediaItems/${encodeURIComponent(mediaItemId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to get media item');
      return res.json();
    },
    [accessToken],
  );

  return { listMediaItems, searchMediaItems, getMediaItem };
};
