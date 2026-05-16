import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, fetchWithAuth, getJson } from '../config';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'fintracker_settings';
const SUPPORTED_THEMES = ['dark', 'light', 'system'];
const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'aed', 'sar', 'egp'];
const SETTING_KEYS = new Set(['theme', 'compactView', 'notifications', 'currency']);

const DEFAULT_SETTINGS = {
  theme: 'dark',
  compactView: false,
  notifications: true,
  currency: 'usd',
};

const SettingsContext = createContext(null);

function normalizeTheme(value) {
  return SUPPORTED_THEMES.includes(value) ? value : DEFAULT_SETTINGS.theme;
}

function normalizeCurrency(value) {
  const code = String(value || '').trim().toLowerCase();
  return SUPPORTED_CURRENCIES.includes(code) ? code : DEFAULT_SETTINGS.currency;
}

function normalizeSettings(data = {}) {
  const notifications = typeof data.notifications === 'boolean'
    ? data.notifications
    : DEFAULT_SETTINGS.notifications;

  return {
    theme: normalizeTheme(data.theme),
    compactView: typeof data.compactView === 'boolean' ? data.compactView : DEFAULT_SETTINGS.compactView,
    notifications,
    currency: normalizeCurrency(data.currency),
  };
}

function normalizeSettingValue(key, value) {
  if (key === 'theme') {
    const nextTheme = normalizeTheme(value);
    return nextTheme === value ? nextTheme : undefined;
  }

  if (key === 'currency') {
    const nextCurrency = normalizeCurrency(value);
    return nextCurrency === String(value || '').trim().toLowerCase() ? nextCurrency : undefined;
  }

  if (key === 'compactView' || key === 'notifications') {
    return typeof value === 'boolean' ? value : undefined;
  }

  return undefined;
}

function readCachedSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved);
    return normalizeSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function cacheSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch {
    // ignore localStorage errors
  }
}

export function SettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const mutationVersionRef = useRef(0);

  const applySettings = useCallback((nextSettings, { cache = false } = {}) => {
    const normalized = normalizeSettings(nextSettings);
    settingsRef.current = normalized;
    setSettings(normalized);

    if (cache) {
      cacheSettings(normalized);
    }

    return normalized;
  }, []);

  useEffect(() => {
    document.body.classList.toggle('compact-mode', settings.compactView);
  }, [settings.compactView]);

  const loadSettings = useCallback(async () => {
    if (authLoading) {
      return { success: false, error: 'Authentication is still loading' };
    }

    const versionAtStart = mutationVersionRef.current;
    setSettingsLoading(true);
    setSettingsError('');

    if (!user?._id) {
      const cachedSettings = readCachedSettings();

      if (mutationVersionRef.current === versionAtStart) {
        applySettings(cachedSettings);
      }

      setSettingsLoading(false);
      return { success: true, settings: cachedSettings, source: 'localStorage' };
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings/me`);
      const data = await getJson(response);

      if (!response.ok) {
        const fallbackSettings = readCachedSettings();
        const error = data.message || 'Failed to load settings';

        if (mutationVersionRef.current === versionAtStart) {
          applySettings(fallbackSettings);
          setSettingsError(error);
        }

        setSettingsLoading(false);
        return { success: false, error, settings: fallbackSettings, source: 'localStorage' };
      }

      const remoteSettings = normalizeSettings(data);

      if (mutationVersionRef.current === versionAtStart) {
        applySettings(remoteSettings, { cache: true });
      }

      setSettingsLoading(false);
      return { success: true, settings: remoteSettings, source: 'mongodb' };
    } catch {
      const fallbackSettings = readCachedSettings();
      const error = 'Server error';

      if (mutationVersionRef.current === versionAtStart) {
        applySettings(fallbackSettings);
        setSettingsError(error);
      }

      setSettingsLoading(false);
      return { success: false, error, settings: fallbackSettings, source: 'localStorage' };
    }
  }, [applySettings, authLoading, user?._id]);

  useEffect(() => {
    if (!authLoading) {
      const timeoutId = window.setTimeout(() => {
        loadSettings();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [authLoading, loadSettings]);

  const updateSetting = useCallback(async (key, value) => {
    if (!SETTING_KEYS.has(key)) {
      return { success: false, error: `Unsupported setting: ${key}` };
    }

    const normalizedValue = normalizeSettingValue(key, value);

    if (normalizedValue === undefined) {
      return { success: false, error: `Invalid value for setting: ${key}` };
    }

    const mutationVersion = mutationVersionRef.current + 1;
    const optimisticSettings = normalizeSettings({
      ...settingsRef.current,
      [key]: normalizedValue,
    });

    mutationVersionRef.current = mutationVersion;
    settingsRef.current = optimisticSettings;
    setSettings(optimisticSettings);
    setSettingsError('');

    if (authLoading || !user?._id) {
      cacheSettings(optimisticSettings);
      return { success: true, settings: optimisticSettings, source: 'localStorage' };
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings/me`, {
        method: 'PUT',
        body: JSON.stringify({ [key]: normalizedValue }),
      });
      const data = await getJson(response);

      if (!response.ok) {
        const error = data.message || 'Failed to update settings';
        setSettingsError(error);
        return { success: false, error };
      }

      const remoteSettings = normalizeSettings(data);

      if (mutationVersionRef.current === mutationVersion) {
        applySettings(remoteSettings, { cache: true });
      }

      return { success: true, settings: remoteSettings, source: 'mongodb' };
    } catch {
      const error = 'Server error';
      setSettingsError(error);
      return { success: false, error };
    }
  }, [applySettings, authLoading, user?._id]);

  const value = useMemo(() => ({
    settings,
    updateSetting,
    loadSettings,
    settingsLoading,
    settingsError,
  }), [loadSettings, settings, settingsError, settingsLoading, updateSetting]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
