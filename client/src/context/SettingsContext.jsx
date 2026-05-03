import { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_SETTINGS = {
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
      if (!saved) return DEFAULT_SETTINGS;

      const savedSettings = JSON.parse(saved);
      delete savedSettings.darkMode;

      return { ...DEFAULT_SETTINGS, ...savedSettings };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('compact-mode', settings.compactView);
  }, [settings.compactView]);

  useEffect(() => {
    try {
      localStorage.setItem('fintracker_settings', JSON.stringify(settings));
    } catch {
      // ignore localStorage errors
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

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
