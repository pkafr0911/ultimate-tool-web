import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: (e: KeyboardEvent) => void;
}

export const useShortcuts = (shortcuts: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Construct key string like 'ctrl+z', 'ctrl+shift+z', 'v', 'delete'
      let keyString = '';
      if (ctrl) keyString += 'ctrl+';
      if (shift) keyString += 'shift+';
      keyString += key;

      if (shortcuts[keyString]) {
        e.preventDefault();
        shortcuts[keyString](e);
      } else if (shortcuts[key]) {
        // Fallback for single keys without modifiers if not explicitly defined with modifiers
        // But be careful not to trigger 'v' when 'ctrl+v' is pressed if 'ctrl+v' is not defined but 'v' is.
        // The logic above handles exact matches first.
        if (!ctrl && !shift) {
          shortcuts[key](e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
