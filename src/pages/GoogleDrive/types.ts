export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  kind: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  owners?: {
    displayName: string;
    emailAddress: string;
    photoLink: string;
  }[];
  capabilities?: {
    canEdit: boolean;
    canCopy: boolean;
    canDownload: boolean;
    canDelete: boolean;
    canShare: boolean;
  };
  trashed?: boolean;
}

export interface DriveListResponse {
  kind: string;
  nextPageToken?: string;
  incompleteSearch: boolean;
  files: DriveFile[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface DriveUser {
  displayName: string;
  emailAddress: string;
  photoLink: string;
  permissionId: string;
}
