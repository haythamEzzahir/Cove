import { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';

const ThemeContext = createContext(null);
const THEMES = ['dark', 'light', 'system'];

function getTheme(value) {
  return THEMES.includes(value) ? value : 'dark';
}

function systemPrefersDark() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }) {
  const { settings, updateSetting } = useSettings();
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Theme comes from SettingsContext, then this context applies it to the page.
  const theme = getTheme(settings.theme);
  const isDark = theme === 'system' ? systemDark : theme === 'dark';

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = (event) => setSystemDark(event.matches);

    mediaQuery.addEventListener('change', onSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  function setTheme(value) {
    return updateSetting('theme', getTheme(value));
  }

  function toggleTheme() {
    return updateSetting('theme', isDark ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
        setLightTheme: () => setTheme('light'),
        setDarkTheme: () => setTheme('dark'),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
