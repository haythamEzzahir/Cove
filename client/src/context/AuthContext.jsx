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

  useEffect(() => {
    const savedUser = localStorage.getItem('fintracker_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}