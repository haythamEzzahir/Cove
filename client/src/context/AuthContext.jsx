import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  const loadWatchlist = useCallback(async (tokenOverride) => {
    const token = tokenOverride || user?.token;

    if (!token) {
      setWatchlist([]);
      return {
        success: false,
        error: 'Please login to view your watchlist',
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
  }, [user?.token]);

  useEffect(() => {
    const savedUser = localStorage.getItem('fintracker_user');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    localStorage.removeItem('fintracker_watchlist');
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (user?.token) {
      loadWatchlist(user.token);
    } else {
      setWatchlist([]);
    }
  }, [loading, user?.token, loadWatchlist]);

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

      if (data.isVerified === false) {
        return {
          success: false,
          error: 'Please verify your email before logging in.',
          needsVerification: true,
        };
      }

      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
        initials: getInitials(data.name),
      };

      setUser(userData);
      localStorage.setItem('fintracker_user', JSON.stringify(userData));
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

  const googleLogin = async (code) => {
    try {
      if (!code) {
        return {
          success: false,
          error: 'Google authorization code missing',
        };
      }

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await getJson(response);

      console.log('Google auth response:', data);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Google authentication failed',
        };
      }

      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar || '',
        provider: data.provider || 'google',
        token: data.token,
        initials: getInitials(data.name),
      };

      setUser(userData);
      localStorage.setItem('fintracker_user', JSON.stringify(userData));

      if (data.token && typeof loadWatchlist === 'function') {
        await loadWatchlist(data.token);
      }

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
    setUser(null);
    setWatchlist([]);
    localStorage.removeItem('fintracker_user');
    localStorage.removeItem('fintracker_watchlist');
  };

  const addToWatchlist = async (coin) => {
    if (!user?.token) {
      return {
        success: false,
        error: 'Please login to add to watchlist',
      };
    }

    const coinId = getCoinId(coin)?.trim().toLowerCase();

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
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ coinId }),
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
    if (!user?.token) {
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
          Authorization: `Bearer ${user.token}`,
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
        loading,
        login,
        signup,
        googleLogin,
        logout,
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
