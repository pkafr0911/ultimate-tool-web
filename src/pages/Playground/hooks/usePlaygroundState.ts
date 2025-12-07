import { useState, useEffect, useCallback } from 'react';

const eventTarget = new EventTarget();

export function usePlaygroundState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return defaultValue;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === key) {
        setState(customEvent.detail.value);
      }
    };
    eventTarget.addEventListener('playground-storage', handler);
    return () => eventTarget.removeEventListener('playground-storage', handler);
  }, [key]);

  const setValue = useCallback(
    (value: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setState(value);
        eventTarget.dispatchEvent(
          new CustomEvent('playground-storage', { detail: { key, value } }),
        );
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
    },
    [key],
  );

  return [state, setValue];
}
