import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const USER_DATA = {
  email: 'ali@cryptowatch.io',
  password: 'password123',
  name: 'Alex Sivera',
  initials: 'AS',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('fintracker_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const savedWatchlist = localStorage.getItem('fintracker_watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    if (email === USER_DATA.email && password === USER_DATA.password) {
      const userData = { email, name: USER_DATA.name, initials: USER_DATA.initials };
      setUser(userData);
      localStorage.setItem('fintracker_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const signup = (name, email, password) => {
    const userData = { 
      name, 
      email, 
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    };
    setUser(userData);
    localStorage.setItem('fintracker_user', JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fintracker_user');
  };

  const addToWatchlist = (coin) => {
    if (!user) return { success: false, error: 'Please login to add to watchlist' };
    if (!watchlist.includes(coin.coinId)) {
      const newWatchlist = [...watchlist, coin.coinId];
      setWatchlist(newWatchlist);
      localStorage.setItem('fintracker_watchlist', JSON.stringify(newWatchlist));
    }
    return { success: true };
  };

  const removeFromWatchlist = (coinId) => {
    if (!user) return { success: false, error: 'Please login to remove from watchlist' };
    const newWatchlist = watchlist.filter(id => id !== coinId);
    setWatchlist(newWatchlist);
    localStorage.setItem('fintracker_watchlist', JSON.stringify(newWatchlist));
    return { success: true };
  };

  const isInWatchlist = (coinId) => watchlist.includes(coinId);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}