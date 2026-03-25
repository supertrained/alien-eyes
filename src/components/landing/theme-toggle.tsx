'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('alien-eyes-theme');
    const initialTheme: Theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = initialTheme;
    setTheme(initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('alien-eyes-theme', nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button className="button button-ghost" type="button" onClick={toggleTheme}>
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
