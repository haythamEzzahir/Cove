import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, fetchWithAuth, getJson } from '../config';

const DEFAULT_SETTINGS = {
  compactView:      false,
  priceAlerts:      true,
  marketNews:       false,
  portfolioSummary: true,
};

const SettingsContext = createContext(null);

const REMOTE_SETTING_KEYS = new Set(['compactView']);

function normalizeRemoteSettings(data = {}) {
  const nextSettings = {};

  if (typeof data.compactView === 'boolean') {
    nextSettings.compactView = data.compactView;
  }

  return nextSettings;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fintracker_settings');
      if (!saved) return DEFAULT_SETTINGS;

      const savedSettings = JSON.parse(saved);
      delete savedSettings.darkMode;
      delete savedSettings.currency;
      delete savedSettings.language;

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

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings/me`);
      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to load settings' };
      }

      setSettings((prev) => ({ ...prev, ...normalizeRemoteSettings(data) }));
      return { success: true, settings: data };
    } catch {
      return { success: false, error: 'Server error' };
    }
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (!REMOTE_SETTING_KEYS.has(key)) {
      return { success: true };
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings/me`, {
        method: 'PUT',
        body: JSON.stringify({ [key]: value }),
      });
      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to update settings' };
      }

      setSettings((prev) => ({ ...prev, ...normalizeRemoteSettings(data) }));
      return { success: true, settings: data };
    } catch {
      return { success: false, error: 'Server error' };
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
