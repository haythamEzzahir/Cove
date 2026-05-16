import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, fetchWithAuth, getJson } from '../config';
import { useAuth } from './AuthContext';

const SETTINGS_CACHE_KEY = 'fintracker_settings';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  compactView: false,
  notifications: true,
  currency: 'usd',
};

const SUPPORTED_THEMES = ['dark', 'light', 'system'];
const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy', 'aed', 'sar', 'egp'];
const SETTINGS_KEYS = ['theme', 'compactView', 'notifications', 'currency'];

const SettingsContext = createContext(null);

function normalizeSettings(data = {}) {
  const theme = SUPPORTED_THEMES.includes(data.theme) ? data.theme : DEFAULT_SETTINGS.theme;
  const currency = SUPPORTED_CURRENCIES.includes(data.currency) ? data.currency : DEFAULT_SETTINGS.currency;

  return {
    theme,
    currency,
    compactView: typeof data.compactView === 'boolean' ? data.compactView : DEFAULT_SETTINGS.compactView,
    notifications: typeof data.notifications === 'boolean' ? data.notifications : DEFAULT_SETTINGS.notifications,
  };
}

function readSettingsCache() {
  try {
    const saved = localStorage.getItem(SETTINGS_CACHE_KEY);
    return saved ? normalizeSettings(JSON.parse(saved)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettingsCache(settings) {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch {
    // localStorage is only a cache, so failing here is not critical.
  }
}

function isValidSetting(key, value) {
  if (!SETTINGS_KEYS.includes(key)) return false;
  if (key === 'theme') return SUPPORTED_THEMES.includes(value);
  if (key === 'currency') return SUPPORTED_CURRENCIES.includes(value);
  return typeof value === 'boolean';
}

export function SettingsProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // compactView affects the whole page layout, so we apply it to the body.
  useEffect(() => {
    document.body.classList.toggle('compact-mode', settings.compactView);
  }, [settings.compactView]);

  const loadSettings = useCallback(async () => {
    if (authLoading) return { success: false, error: 'Authentication is still loading' };

    setLoading(true);
    setError('');

    // Without a logged-in user, MongoDB is not available. Use the local cache only here.
    if (!user?._id) {
      const cachedSettings = readSettingsCache();
      setSettings(cachedSettings);
      setLoading(false);
      return { success: true, settings: cachedSettings, source: 'localStorage' };
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings/me`);
      const data = await getJson(response);

      if (!response.ok) {
        const cachedSettings = readSettingsCache();
        const message = data.message || 'Failed to load settings';
        setSettings(cachedSettings);
        setError(message);
        setLoading(false);
        return { success: false, error: message, settings: cachedSettings };
      }

      // After login, MongoDB is the source of truth.
      const remoteSettings = normalizeSettings(data);
      setSettings(remoteSettings);
      saveSettingsCache(remoteSettings);
      setLoading(false);
      return { success: true, settings: remoteSettings, source: 'mongodb' };
    } catch {
      const cachedSettings = readSettingsCache();
      setSettings(cachedSettings);
      setError('Server error');
      setLoading(false);
      return { success: false, error: 'Server error', settings: cachedSettings };
    }
  }, [authLoading, user?._id]);

  async function updateSetting(key, value) {
    if (!isValidSetting(key, value)) {
      return { success: false, error: `Invalid setting: ${key}` };
    }

    const nextSettings = normalizeSettings({ ...settings, [key]: value });

    // Update React immediately so the UI feels fast.
    setSettings(nextSettings);
    setError('');

    // If the user is not connected, keep only a local fallback.
    if (authLoading || !user?._id) {
      saveSettingsCache(nextSettings);
      return { success: true, settings: nextSettings, source: 'localStorage' };
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/api/settings/me`, {
        method: 'PUT',
        body: JSON.stringify({ [key]: value }),
      });
      const data = await getJson(response);

      if (!response.ok) {
        const message = data.message || 'Failed to update settings';
        setError(message);
        return { success: false, error: message };
      }

      // The backend response becomes the new React state.
      const savedSettings = normalizeSettings(data);
      setSettings(savedSettings);
      saveSettingsCache(savedSettings);
      return { success: true, settings: savedSettings, source: 'mongodb' };
    } catch {
      setError('Server error');
      return { success: false, error: 'Server error' };
    }
  }

  // Load settings after the auth status is known, and again when the user changes.
  useEffect(() => {
    if (!authLoading) {
      const timeoutId = window.setTimeout(() => {
        loadSettings();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [authLoading, loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, loadSettings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
