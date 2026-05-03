/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'token';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

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

async function getJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
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

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('fintracker_user');
  localStorage.removeItem('fintracker_watchlist');
  localStorage.removeItem('user');
}

function getStoredToken() {
  const savedToken = localStorage.getItem(TOKEN_KEY);

  if (savedToken) return savedToken;

  try {
    const legacyUser = JSON.parse(localStorage.getItem('fintracker_user') || '{}');
    return legacyUser.token || '';
  } catch {
    return '';
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  const clearAuth = useCallback(() => {
    setToken('');
    setUser(null);
    setWatchlist([]);
    clearStoredAuth();
  }, []);

  const persistToken = useCallback((nextToken) => {
    setToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.removeItem('fintracker_user');
    localStorage.removeItem('user');
  }, []);

  const refreshUser = useCallback(async (tokenOverride) => {
    const authToken = tokenOverride || token;

    if (!authToken) {
      setUser(null);
      return {
        success: false,
        error: 'Please login to view your profile',
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await getJson(response);

      if (response.status === 401) {
        clearAuth();
        return {
          success: false,
          error: data.message || 'Session expired',
          unauthorized: true,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to load profile',
        };
      }

      const userData = normalizeAuthUser(data);
      setUser(userData);

      return { success: true, user: userData };
    } catch {
      return {
        success: false,
        error: 'Server error',
      };
    }
  }, [clearAuth, token]);

  const updateCurrentUser = useCallback((updates) => {
    setUser(normalizeAuthUser(updates));
  }, []);

  const loadWatchlist = useCallback(async (tokenOverride) => {
    const authToken = tokenOverride || token;

    if (!authToken) {
      setWatchlist([]);
      return {
        success: false,
        error: 'Please login to view your watchlist',
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to load watchlist',
        };
      }

      const coinIds = normalizeCoinIds(data);
      setWatchlist(coinIds);

      return { success: true, coinIds };
    } catch {
      return {
        success: false,
        error: 'Server error',
      };
    }
  }, [token]);

  useEffect(() => {
    let ignore = false;

    async function hydrateUser() {
      localStorage.removeItem('fintracker_user');
      localStorage.removeItem('fintracker_watchlist');
      localStorage.removeItem('user');

      if (!token) {
        if (!ignore) setLoading(false);
        return;
      }

      localStorage.setItem(TOKEN_KEY, token);
      const result = await refreshUser(token);

      if (result.success && !ignore) {
        await loadWatchlist(token);
      }

      if (!ignore) {
        setLoading(false);
      }
    }

    hydrateUser();

    return () => {
      ignore = true;
    };
  }, [loadWatchlist, refreshUser, token]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Invalid email or password',
          needsVerification: data.needsVerification || false,
        };
      }

      if (!data.token) {
        return {
          success: false,
          error: 'Authentication token missing',
        };
      }

      persistToken(data.token);
      await refreshUser(data.token);
      await loadWatchlist(data.token);

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'An error occurred. Please try again.',
      };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Signup failed',
        };
      }

      if (!data.token) {
        return {
          success: false,
          error: 'Authentication token missing',
        };
      }

      persistToken(data.token);
      await refreshUser(data.token);
      await loadWatchlist(data.token);

      return {
        success: true,
        message: data.message,
      };
    } catch {
      return {
        success: false,
        error: 'An error occurred. Please try again.',
      };
    }
  };

  const googleLogin = async (googleResponse) => {
    try {
      const payload = typeof googleResponse === 'string'
        ? { code: googleResponse }
        : {
          code: googleResponse?.code,
          credential: googleResponse?.credential,
        };

      if (!payload.code && !payload.credential) {
        return {
          success: false,
          error: 'Google authorization code or credential missing',
        };
      }

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Google authentication failed',
        };
      }

      if (!data.token) {
        return {
          success: false,
          error: 'Authentication token missing',
        };
      }

      persistToken(data.token);
      await refreshUser(data.token);
      await loadWatchlist(data.token);

      return { success: true };
    } catch (error) {
      console.error('Google login frontend error:', error);

      return {
        success: false,
        error: error.message || 'Google authentication failed',
      };
    }
  };

  const logout = () => {
    clearAuth();
  };

  const addToWatchlist = async (coin) => {
    if (!token) {
      return {
        success: false,
        error: 'Please login to add to watchlist',
      };
    }

    const coinPayload = normalizeWatchlistCoinPayload(coin);
    const coinId = coinPayload?.coinId;

    if (!coinId) {
      return {
        success: false,
        error: 'coinId is required',
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coinPayload),
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to add coin',
        };
      }

      const responseCoinIds = normalizeCoinIds(data);
      const mergedCoinIds = normalizeCoinIds([...watchlist, ...responseCoinIds, coinId]);

      setWatchlist((prev) => normalizeCoinIds([...prev, ...responseCoinIds, coinId]));

      return { success: true, coinIds: mergedCoinIds };
    } catch {
      return {
        success: false,
        error: 'Server error',
      };
    }
  };

  const removeFromWatchlist = async (coinId) => {
    if (!token) {
      return {
        success: false,
        error: 'Please login to remove from watchlist',
      };
    }

    const normalizedCoinId = getCoinId(coinId)?.trim().toLowerCase();

    if (!normalizedCoinId) {
      return {
        success: false,
        error: 'coinId is required',
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/watchlist/${encodeURIComponent(normalizedCoinId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to remove coin',
        };
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
      return {
        success: false,
        error: 'Server error',
      };
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
        token,
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
