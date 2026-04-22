import { useEffect, useRef } from 'react';

interface ShortcutMap {
  [key: string]: (e: KeyboardEvent) => void;
}

/**
 * Subscribe to a map of shortcut keystrings (e.g. 'v', 'ctrl+z', 'ctrl+shift+z').
 * Ignores key events while typing into an input/textarea/contenteditable element.
 */
export const useShortcuts = (shortcuts: ShortcutMap) => {
  // Keep latest map in a ref so we don't rebind the global listener on every render
  const mapRef = useRef(shortcuts);
  mapRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      let keyString = '';
      if (ctrl) keyString += 'ctrl+';
      if (shift) keyString += 'shift+';
      keyString += key;

      const shortcutFn = mapRef.current[keyString];
      if (shortcutFn) {
        e.preventDefault();
        shortcutFn(e);
        return;
      }

      // Fallback to bare-key map only when no modifiers are held
      if (!ctrl && !shift && mapRef.current[key]) {
        e.preventDefault();
        mapRef.current[key](e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
