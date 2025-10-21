import { disable, enable, setFetchMethod } from 'darkreader';
import { useEffect, useState } from 'react';

setFetchMethod(window.fetch);

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dark-mode') === 'true';
    setDarkMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('dark-mode', String(darkMode));

    if (darkMode) {
      enable({
        brightness: 100,
        contrast: 90,
        sepia: 10,
      });
      document.body.classList.add('dark-mode');
    } else {
      disable();
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return { darkMode, setDarkMode };
};
