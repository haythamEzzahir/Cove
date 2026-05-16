import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings } from './SettingsContext';

const DEFAULT_THEME = 'dark';
const SUPPORTED_THEMES = ['dark', 'light', 'system'];

const ThemeContext = createContext(null);

function normalizeTheme(value) {
  return SUPPORTED_THEMES.includes(value) ? value : DEFAULT_THEME;
}

function getSystemPrefersDark() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }) {
  const { settings, updateSetting } = useSettings();
  const theme = normalizeTheme(settings.theme);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  const isDark = theme === 'system' ? systemPrefersDark : theme === 'dark';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemPrefersDark(event.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', isDark);
  }, [isDark]);

  const setTheme = useCallback((value) => {
    return updateSetting('theme', normalizeTheme(value));
  }, [updateSetting]);

  const toggleTheme = useCallback(() => {
    return updateSetting('theme', isDark ? 'light' : 'dark');
  }, [isDark, updateSetting]);

  const setLightTheme = useCallback(() => setTheme('light'), [setTheme]);
  const setDarkTheme = useCallback(() => setTheme('dark'), [setTheme]);

  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
    setLightTheme,
    setDarkTheme,
  }), [isDark, setDarkTheme, setLightTheme, setTheme, theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
