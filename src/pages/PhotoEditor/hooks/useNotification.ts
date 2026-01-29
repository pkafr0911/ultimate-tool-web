import { useCallback, useState } from 'react';
import { message, notification } from 'antd';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface UseNotificationOptions {
  defaultDuration?: number;
}

interface NotificationConfig {
  title?: string;
  description?: string;
  duration?: number;
  key?: string;
}

export const useNotification = (options: UseNotificationOptions = {}) => {
  const { defaultDuration = 3 } = options;
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Simple message notifications
  const showMessage = useCallback(
    (type: NotificationType, content: string, duration?: number) => {
      message[type](content, duration ?? defaultDuration);
    },
    [defaultDuration],
  );

  const success = useCallback(
    (content: string, duration?: number) => {
      showMessage('success', content, duration);
    },
    [showMessage],
  );

  const info = useCallback(
    (content: string, duration?: number) => {
      showMessage('info', content, duration);
    },
    [showMessage],
  );

  const warning = useCallback(
    (content: string, duration?: number) => {
      showMessage('warning', content, duration);
    },
    [showMessage],
  );

  const error = useCallback(
    (content: string, duration?: number) => {
      showMessage('error', content, duration);
    },
    [showMessage],
  );

  // Detailed notifications
  const notify = useCallback(
    (type: NotificationType, config: NotificationConfig) => {
      notification[type]({
        message: config.title || type.charAt(0).toUpperCase() + type.slice(1),
        description: config.description,
        duration: config.duration ?? defaultDuration,
        key: config.key,
      });
    },
    [defaultDuration],
  );

  // Loading state with auto-complete message
  const withLoading = useCallback(
    async <T>(
      key: string,
      operation: () => Promise<T>,
      messages: {
        loading: string;
        success: string;
        error?: string;
      },
    ): Promise<T | null> => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      message.loading({ content: messages.loading, key, duration: 0 });

      try {
        const result = await operation();
        message.success({ content: messages.success, key, duration: defaultDuration });
        return result;
      } catch (err) {
        const errorMessage =
          messages.error || (err instanceof Error ? err.message : 'Operation failed');
        message.error({ content: errorMessage, key, duration: defaultDuration });
        console.error(`Operation "${key}" failed:`, err);
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [defaultDuration],
  );

  // Check if a specific operation is loading
  const isLoading = useCallback((key: string) => loading[key] ?? false, [loading]);

  // Any loading state
  const isAnyLoading = Object.values(loading).some(Boolean);

  return {
    success,
    info,
    warning,
    error,
    notify,
    withLoading,
    isLoading,
    isAnyLoading,
    loading,
  };
};

// Pre-defined message helpers for common operations
export const photoEditorMessages = {
  // Project operations
  projectSaved: () => message.success('Project saved successfully'),
  projectLoaded: () => message.success('Project loaded'),
  projectExported: (format: string) => message.success(`Exported as ${format}`),
  projectImportFailed: () =>
    message.error('Failed to import project. Make sure it is a valid project file.'),

  // Image operations
  imageAdded: () => message.success('Image added to canvas'),
  imageLoadFailed: () => message.error('Failed to load image'),

  // Clipboard operations
  copied: () => message.success('Copied to clipboard'),
  pasted: () => message.success('Pasted from clipboard'),
  nothingToCopy: () => message.info('Nothing selected to copy'),
  nothingToPaste: () => message.info('Nothing in clipboard to paste'),

  // Filter operations
  filterApplied: (name: string) => message.success(`${name} applied`),
  filterFailed: (name: string) => message.error(`Failed to apply ${name}. Please try again.`),

  // Selection operations
  selectionCreated: () => message.success('Selection created'),
  selectionCleared: () => message.info('Selection cleared'),

  // Canvas operations
  canvasCleared: () => message.info('Canvas cleared'),
  objectDeleted: () => message.success('Deleted'),

  // History operations
  undoPerformed: () => message.info('Undo'),
  redoPerformed: () => message.info('Redo'),
  noMoreUndo: () => message.info('Nothing to undo'),
  noMoreRedo: () => message.info('Nothing to redo'),

  // Error handling
  genericError: (error?: string) => message.error(error || 'An error occurred. Please try again.'),
  operationFailed: (operation: string) => message.error(`${operation} failed. Please try again.`),

  // Warnings
  largeImageWarning: () =>
    notification.warning({
      message: 'Large Image Detected',
      description:
        'This image is quite large. Some operations may take longer to process. Consider using preview mode for faster editing.',
      duration: 5,
    }),
  unsavedChanges: () =>
    notification.warning({
      message: 'Unsaved Changes',
      description: 'You have unsaved changes. Save your project to avoid losing work.',
      duration: 4,
    }),
  crossOriginWarning: () =>
    notification.warning({
      message: 'Cross-Origin Image',
      description:
        'This image is from a different domain and may not support some operations. Try downloading and uploading the image instead.',
      duration: 5,
    }),
};

export default useNotification;
