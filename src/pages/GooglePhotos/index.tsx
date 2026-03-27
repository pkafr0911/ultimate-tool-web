import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Space,
  Avatar,
  Dropdown,
  Menu,
  Typography,
  Spin,
  Empty,
  Segmented,
  Input,
  DatePicker,
} from 'antd';
import {
  GoogleOutlined,
  LogoutOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  PlayCircleFilled,
  CloudOutlined,
} from '@ant-design/icons';
import { useGoogleAuth } from '../GoogleDrive/hooks/useGoogleAuth';
import { useDriveApi } from '../GoogleDrive/hooks/useDriveApi';
import { usePhotosApi } from './hooks/usePhotosApi';
import type { PhotosSearchFilters } from './hooks/usePhotosApi';
import { MediaItem, fromDriveFile, fromPhotosItem } from './mediaTypes';
import PhotoLightbox from './PhotoLightbox';
import AuthImage from './AuthImage';
import './styles.less';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

type MediaFilter = 'all' | 'photos' | 'videos';
type SourceMode = 'photos' | 'drive' | 'both';

const DRIVE_MEDIA_QUERY: Record<MediaFilter, string> = {
  all: "(mimeType contains 'image/' or mimeType contains 'video/')",
  photos: "mimeType contains 'image/'",
  videos: "mimeType contains 'video/'",
};

const PHOTOS_MEDIA_TYPE: Record<MediaFilter, 'ALL_MEDIA' | 'PHOTO' | 'VIDEO'> = {
  all: 'ALL_MEDIA',
  photos: 'PHOTO',
  videos: 'VIDEO',
};

const PAGE_SIZE = 50;

/** Group items by date */
function groupByDate(items: MediaItem[]): { date: string; items: MediaItem[] }[] {
  const map = new Map<string, MediaItem[]>();
  for (const item of items) {
    const d = item.createdTime?.slice(0, 10) ?? 'Unknown';
    const arr = map.get(d);
    if (arr) arr.push(item);
    else map.set(d, [item]);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function formatDate(iso: string): string {
  if (iso === 'Unknown') return iso;
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const GooglePhotosPage: React.FC = () => {
  const { user, isSignedIn, accessToken, signIn, signOut } = useGoogleAuth();
  const { queryFiles } = useDriveApi(accessToken);
  const { listMediaItems, searchMediaItems } = usePhotosApi(accessToken);

  const [sourceMode, setSourceMode] = useState<SourceMode>('photos');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const loadingRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  // ─── Load from Google Photos Library API ─────────────────────────
  const loadFromPhotos = useCallback(
    async (pageToken?: string, filter?: MediaFilter, range?: [string, string] | null) => {
      const filters: PhotosSearchFilters = {};
      const mf = filter ?? mediaFilter;

      if (mf !== 'all') {
        filters.mediaTypeFilter = { mediaTypes: [PHOTOS_MEDIA_TYPE[mf]] };
      }

      const dr = range !== undefined ? range : dateRange;
      if (dr) {
        const [start, end] = dr;
        const [sy, sm, sd] = start.split('-').map(Number);
        const [ey, em, ed] = end.split('-').map(Number);
        filters.dateFilter = {
          ranges: [
            {
              startDate: { year: sy, month: sm, day: sd },
              endDate: { year: ey, month: em, day: ed },
            },
          ],
        };
      }

      const hasFilters = filters.mediaTypeFilter || filters.dateFilter;
      const res = hasFilters
        ? await searchMediaItems(filters, PAGE_SIZE, pageToken)
        : await listMediaItems(PAGE_SIZE, pageToken);

      return {
        items: res.mediaItems.map(fromPhotosItem),
        nextPageToken: res.nextPageToken,
      };
    },
    [mediaFilter, dateRange, listMediaItems, searchMediaItems],
  );

  // ─── Load from Drive API ─────────────────────────────────────────
  const loadFromDrive = useCallback(
    async (
      pageToken?: string,
      filter?: MediaFilter,
      range?: [string, string] | null,
      query?: string,
    ) => {
      const mf = filter ?? mediaFilter;
      const parts = [DRIVE_MEDIA_QUERY[mf], 'trashed = false'];

      const dr = range !== undefined ? range : dateRange;
      if (dr) {
        parts.push(`createdTime >= '${dr[0]}T00:00:00'`);
        parts.push(`createdTime <= '${dr[1]}T23:59:59'`);
      }
      const sq = (query ?? searchQuery).trim();
      if (sq) {
        const escaped = sq.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        parts.push(`name contains '${escaped}'`);
      }

      const res = await queryFiles(parts.join(' and '), PAGE_SIZE, pageToken);
      return {
        items: res.files.map(fromDriveFile),
        nextPageToken: res.nextPageToken,
      };
    },
    [mediaFilter, dateRange, searchQuery, queryFiles],
  );

  // ─── Unified loader ──────────────────────────────────────────────
  const loadMedia = useCallback(
    async (
      pageToken?: string,
      source?: SourceMode,
      filter?: MediaFilter,
      range?: [string, string] | null,
      query?: string,
    ) => {
      if (!accessToken || loadingRef.current) return;
      loadingRef.current = true;
      const isMore = !!pageToken;
      if (isMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const src = source ?? sourceMode;
        let result: { items: MediaItem[]; nextPageToken?: string };

        if (src === 'photos') {
          result = await loadFromPhotos(pageToken, filter, range);
        } else if (src === 'drive') {
          result = await loadFromDrive(pageToken, filter, range, query);
        } else {
          // Both — load in parallel, merge by date
          const [p, d] = await Promise.all([
            loadFromPhotos(pageToken, filter, range).catch(() => ({
              items: [] as MediaItem[],
              nextPageToken: undefined,
            })),
            loadFromDrive(pageToken, filter, range, query).catch(() => ({
              items: [] as MediaItem[],
              nextPageToken: undefined,
            })),
          ]);
          // Deduplicate by name+date (rough)
          const seen = new Set(p.items.map((i) => `${i.name}|${i.createdTime?.slice(0, 10)}`));
          const uniqueDrive = d.items.filter(
            (i) => !seen.has(`${i.name}|${i.createdTime?.slice(0, 10)}`),
          );
          const merged = [...p.items, ...uniqueDrive].sort((a, b) =>
            (b.createdTime ?? '').localeCompare(a.createdTime ?? ''),
          );
          result = {
            items: merged,
            nextPageToken: p.nextPageToken || d.nextPageToken,
          };
        }

        setItems((prev) => (isMore ? [...prev, ...result.items] : result.items));
        setNextPageToken(result.nextPageToken);
      } catch (e) {
        console.error(e);
      } finally {
        loadingRef.current = false;
        if (isMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [accessToken, sourceMode, loadFromPhotos, loadFromDrive],
  );

  useEffect(() => {
    if (isSignedIn) {
      loadMedia(undefined, sourceMode, mediaFilter, dateRange, searchQuery);
    } else {
      setItems([]);
    }
  }, [isSignedIn, sourceMode, mediaFilter, dateRange]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setItems([]);
    setNextPageToken(undefined);
    // Google Photos API doesn't support text search — switch to drive when searching
    if (value.trim() && sourceMode === 'photos') {
      setSourceMode('drive');
      loadMedia(undefined, 'drive', mediaFilter, dateRange, value);
    } else {
      loadMedia(undefined, sourceMode, mediaFilter, dateRange, value);
    }
  };

  const handleFilterChange = (value: string | number) => {
    setMediaFilter(value as MediaFilter);
    setItems([]);
    setNextPageToken(undefined);
  };

  const handleSourceChange = (value: string | number) => {
    setSourceMode(value as SourceMode);
    setItems([]);
    setNextPageToken(undefined);
    setSearchQuery('');
  };

  const handleDateChange = (_: any, dateStrings: [string, string]) => {
    const range = dateStrings[0] && dateStrings[1] ? dateStrings : null;
    setDateRange(range as [string, string] | null);
    setItems([]);
    setNextPageToken(undefined);
  };

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextPageToken && !loading && !loadingMore) {
          loadMedia(nextPageToken);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextPageToken, loading, loadingMore, loadMedia]);

  const grouped = useMemo(() => groupByDate(items), [items]);

  const isVideo = (item: MediaItem) => item.mimeType.startsWith('video/');

  const userMenu = (
    <Menu
      items={[{ key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', onClick: signOut }]}
    />
  );

  return (
    <PageContainer
      header={{
        title: 'Google Photos',
        extra: [
          isSignedIn ? (
            <Dropdown key="user" overlay={userMenu}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={user?.picture} icon={<GoogleOutlined />} />
                <Text>{user?.name}</Text>
              </Space>
            </Dropdown>
          ) : (
            <Button key="login" type="primary" icon={<GoogleOutlined />} onClick={signIn}>
              Sign in with Google
            </Button>
          ),
        ],
      }}
    >
      <Card>
        {isSignedIn ? (
          <div className="gp-container">
            {/* Toolbar */}
            <div className="gp-toolbar">
              <Space wrap>
                <Segmented
                  value={sourceMode}
                  onChange={handleSourceChange}
                  options={[
                    { label: 'Google Photos', value: 'photos', icon: <PictureOutlined /> },
                    { label: 'Drive', value: 'drive', icon: <CloudOutlined /> },
                    { label: 'Both', value: 'both', icon: <AppstoreOutlined /> },
                  ]}
                />
                <Segmented
                  value={mediaFilter}
                  onChange={handleFilterChange}
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'Photos', value: 'photos' },
                    { label: 'Videos', value: 'videos' },
                  ]}
                />
              </Space>
              <Space wrap>
                <RangePicker
                  onChange={handleDateChange}
                  placeholder={['Start date', 'End date']}
                  allowClear
                />
                <Input.Search
                  placeholder="Search by name..."
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => {
                    if (!e.target.value) handleSearch('');
                  }}
                  style={{ width: 220 }}
                />
              </Space>
            </div>

            {/* Photo Grid */}
            {loading && items.length === 0 ? (
              <div className="gp-center">
                <Spin size="large" />
              </div>
            ) : items.length === 0 ? (
              <div className="gp-center">
                <Empty description="No photos or videos found" />
              </div>
            ) : (
              <>
                {grouped.map((group) => (
                  <div key={group.date} className="gp-date-group">
                    <div className="gp-date-header">
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {formatDate(group.date)}
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
                        {group.items.length} item{group.items.length > 1 ? 's' : ''}
                      </Text>
                    </div>
                    <div className="gp-masonry">
                      {group.items.map((item) => {
                        const globalIdx = items.indexOf(item);
                        return (
                          <div
                            key={item.id}
                            className="gp-masonry-item"
                            onClick={() => setLightboxIndex(globalIdx)}
                          >
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.name}
                                loading="lazy"
                                draggable={false}
                                onError={(e) => {
                                  // If direct URL fails and we have a Drive file ID, try AuthImage fallback
                                  if (item.driveFileId) {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    // Replace with AuthImage by re-rendering without thumbnailUrl
                                    const parent = target.parentElement;
                                    if (parent) {
                                      target.remove();
                                    }
                                  } else {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }
                                }}
                              />
                            ) : (
                              <AuthImage
                                fileId={item.driveFileId}
                                accessToken={accessToken}
                                alt={item.name}
                                size={400}
                              />
                            )}
                            {isVideo(item) && (
                              <div className="gp-video-badge">
                                <PlayCircleFilled />
                              </div>
                            )}
                            <div className="gp-item-overlay">
                              <Text className="gp-item-name" ellipsis>
                                {item.name}
                              </Text>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Infinite scroll sentinel */}
                <div
                  ref={sentinelRef}
                  style={{ height: 1, textAlign: 'center', padding: loadingMore ? 12 : 0 }}
                >
                  {loadingMore && <Spin size="small" />}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="gp-center" style={{ padding: 60 }}>
            <PictureOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Sign in to browse your Google Photos</Title>
          </div>
        )}
      </Card>

      {/* Lightbox */}
      <PhotoLightbox
        items={items}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        onChange={setLightboxIndex}
        accessToken={accessToken}
      />
    </PageContainer>
  );
};

export default GooglePhotosPage;
