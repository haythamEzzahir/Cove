import { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme } from '../styles/tokens';

const DEFAULT_SETTINGS = {
  darkMode:         true,
  compactView:      false,
  priceAlerts:      true,
  marketNews:       false,
  portfolioSummary: true,
  currency:         'USD',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fintracker_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    applyTheme(settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  useEffect(() => {
    document.body.classList.toggle('compact-mode', settings.compactView);
  }, [settings.compactView]);

  useEffect(() => {
    try {
      localStorage.setItem('fintracker_settings', JSON.stringify(settings));
    } catch {
      // ignore localStorage errors (e.g. private browsing)
    }
  }, [settings]);

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}