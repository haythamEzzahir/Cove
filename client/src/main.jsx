import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { API_URL } from './config';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Markets from './pages/Markets';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyPending from './pages/VerifyPending';
import './index.css';

const GOOGLE_CONFIG_URL = `${API_URL}/api/auth/google/config`;

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/verify-pending',
    element: <VerifyPending />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'markets', element: <Markets /> },
      { path: 'watchlist', element: <Watchlist /> },
      { path: 'portfolio', element: <Portfolio /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'settings', element: <Settings /> },
      { path: 'settings/profile', element: <Profile /> },
    ],
  },
]);

// Fetch the Google OAuth client ID from backend and wrap children in GoogleOAuthProvider
function GoogleProviderWrapper({ children }) {
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClientId = async () => {
      try {
        const response = await fetch(GOOGLE_CONFIG_URL);
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await response.json()
          : {};

        if (!response.ok || !data.clientId) {
          throw new Error('Google configuration unavailable');
        }

        setClientId(data.clientId);
      } catch (err) {
        console.error('Google config error:', err);
        setError('Google login is not available');
      } finally {
        setLoading(false);
      }
    };

    loadClientId();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleProviderWrapper>
      <ThemeProvider>
        <SettingsProvider>
          <CurrencyProvider>
            <AuthProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </AuthProvider>
          </CurrencyProvider>
        </SettingsProvider>
      </ThemeProvider>
    </GoogleProviderWrapper>
  </StrictMode>
);
