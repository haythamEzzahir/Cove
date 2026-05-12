import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, getInitials, getJson } from '../config';

const AuthContext = createContext(null);

function normalizeAuthUser(data = {}) {
  const email = data.email || '';
  const name = data.name?.trim() || email.split('@')[0] || 'User';

  return {
    _id: data._id || data.id || '',
    name,
    email,
    avatar: data.avatar || '',
    bio: data.bio || '',
    provider: data.provider || 'local',
    role: data.role || 'user',
    isVerified: data.isVerified,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    initials: getInitials(name),
  };
}

function normalizeCoinIds(data) {
  if (Array.isArray(data)) {
    const coinIds = data
      .map((item) => (typeof item === 'string' ? item : item?.coinId || item?.id))
      .filter(Boolean)
      .map((coinId) => String(coinId).trim().toLowerCase());

    return [...new Set(coinIds)];
  }

  if (Array.isArray(data?.watchlist)) {
    return normalizeCoinIds(data.watchlist);
  }

  if (Array.isArray(data?.coins)) {
    return normalizeCoinIds(data.coins);
  }

  if (Array.isArray(data?.items)) {
    return normalizeCoinIds(data.items);
  }

  return [];
}

function getCoinId(coin) {
  if (typeof coin === 'string') return coin;
  return coin?.coinId || coin?.id;
}

function normalizeWatchlistCoinPayload(coin) {
  const coinId = getCoinId(coin)?.trim().toLowerCase();

  if (!coinId) return null;

  if (typeof coin === 'string') {
    return { coinId };
  }

  const hasCurrentPrice = (
    coin?.current_price !== undefined
    && coin?.current_price !== null
    && coin?.current_price !== ''
  );
  const currentPrice = Number(coin?.current_price);

  return {
    coinId,
    symbol: String(coin?.symbol || coin?.ticker || '').trim().toLowerCase(),
    name: String(coin?.name || coinId).trim(),
    image: coin?.image || '',
    current_price: hasCurrentPrice && Number.isFinite(currentPrice) ? currentPrice : null,
  };
}

const authFetch = async (url, options = {}) => {
  const { headers = {}, ...rest } = options;

  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  });
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  const clearAuth = useCallback(() => {
    setUser(null);
    setWatchlist([]);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/api/auth/me`);
      const data = await getJson(response);

      if (response.status === 401) {
        const refreshResponse = await authFetch(`${API_URL}/api/auth/refresh`, { method: 'POST' });

        if (refreshResponse.ok) {
          const meResponse = await authFetch(`${API_URL}/api/auth/me`);
          const meData = await getJson(meResponse);

          if (meResponse.ok) {
            const userData = normalizeAuthUser(meData);
            setUser(userData);
            return { success: true, user: userData };
          }
        }

        clearAuth();
        return { success: false, error: 'Session expired', unauthorized: true };
      }

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to load profile' };
      }

      const userData = normalizeAuthUser(data);
      setUser(userData);

      return { success: true, user: userData };
    } catch {
      return { success: false, error: 'Server error' };
    }
  }, [clearAuth]);

  const updateCurrentUser = useCallback((updates) => {
    setUser(normalizeAuthUser(updates));
  }, []);

  const loadWatchlist = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/api/watchlist`);
      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to load watchlist' };
      }

      const coinIds = normalizeCoinIds(data);
      setWatchlist(coinIds);

      return { success: true, coinIds };
    } catch {
      return { success: false, error: 'Server error' };
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function hydrateUser() {
      const result = await refreshUser();

      if (result.success && !ignore) {
        await loadWatchlist();
      }

      if (!ignore) {
        setLoading(false);
      }
    }

    hydrateUser();

    return () => {
      ignore = true;
    };
  }, [loadWatchlist, refreshUser]);

  const login = async (email, password) => {
    try {
      const response = await authFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Invalid email or password',
          needsVerification: data.needsVerification || false,
          email: data.email || '',
        };
      }

      await refreshUser();
      await loadWatchlist();

      return { success: true };
    } catch {
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await authFetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Signup failed' };
      }

      await refreshUser();
      await loadWatchlist();

      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  };

  const googleLogin = async (googleResponse) => {
    try {
      const payload = typeof googleResponse === 'string'
        ? { code: googleResponse }
        : { code: googleResponse?.code, credential: googleResponse?.credential };

      if (!payload.code && !payload.credential) {
        return { success: false, error: 'Google authorization code or credential missing' };
      }

      const response = await authFetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Google authentication failed' };
      }

      await refreshUser();
      await loadWatchlist();

      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Google authentication failed' };
    }
  };

  const logout = async () => {
    try {
      await authFetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
    } catch {
    }
    clearAuth();
  };

  const addToWatchlist = async (coin) => {
    const coinPayload = normalizeWatchlistCoinPayload(coin);
    const coinId = coinPayload?.coinId;

    if (!coinId) {
      return { success: false, error: 'coinId is required' };
    }

    try {
      const response = await authFetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        body: JSON.stringify(coinPayload),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to add coin' };
      }

      const responseCoinIds = normalizeCoinIds(data);
      const mergedCoinIds = normalizeCoinIds([...watchlist, ...responseCoinIds, coinId]);

      setWatchlist((prev) => normalizeCoinIds([...prev, ...responseCoinIds, coinId]));

      return { success: true, coinIds: mergedCoinIds };
    } catch {
      return { success: false, error: 'Server error' };
    }
  };

  const removeFromWatchlist = async (coinId) => {
    const normalizedCoinId = getCoinId(coinId)?.trim().toLowerCase();

    if (!normalizedCoinId) {
      return { success: false, error: 'coinId is required' };
    }

    try {
      const response = await authFetch(`${API_URL}/api/watchlist/${encodeURIComponent(normalizedCoinId)}`, {
        method: 'DELETE',
      });

      const data = await getJson(response);

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to remove coin' };
      }

      const responseCoinIds = normalizeCoinIds(data);
      const nextCoinIds = responseCoinIds.length
        ? responseCoinIds
        : watchlist.filter((id) => id !== normalizedCoinId);

      setWatchlist((prev) => (
        responseCoinIds.length
          ? responseCoinIds
          : prev.filter((id) => id !== normalizedCoinId)
      ));

      return { success: true, coinIds: nextCoinIds };
    } catch {
      return { success: false, error: 'Server error' };
    }
  };

  const isInWatchlist = (coinId) => {
    const normalizedCoinId = getCoinId(coinId)?.trim().toLowerCase();
    return Boolean(normalizedCoinId && watchlist.includes(normalizedCoinId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        register: signup,
        googleLogin,
        logout,
        refreshUser,
        updateCurrentUser,
        watchlist,
        watchlistItems: watchlist,
        loadWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}
