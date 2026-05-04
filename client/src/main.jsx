import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyPending from './pages/VerifyPending';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
      { index: true, element: <Dashboard /> },
      { path: 'markets', element: <Dashboard /> },
      { path: 'watchlist', element: <Watchlist /> },
      { path: 'portfolio', element: <Portfolio /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'news', element: <Dashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'settings/profile', element: <Profile /> },
    ],
  },
]);

function GoogleProviderWrapper({ children }) {
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClientId = async () => {
      try {
        const response = await fetch(GOOGLE_CONFIG_URL, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await response.json()
          : { message: await response.text() };

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Google config route not found: GET ${GOOGLE_CONFIG_URL}`);
          }

          throw new Error(data.message || data.error || `Failed to load Google config (HTTP ${response.status})`);
        }

        if (!data.clientId) {
          throw new Error('GOOGLE_CLIENT_ID is missing or empty in the backend .env');
        }

        setClientId(data.clientId);
      } catch (err) {
        console.error('Failed to load Google Client ID:', err);
        const message = err instanceof TypeError && err.message === 'Failed to fetch'
          ? `Unable to reach backend at ${API_URL}. Start the backend on port 5000 and verify CORS allows ${window.location.origin}.`
          : err.message || 'Unknown Google configuration error';

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadClientId();
  }, []);

  if (loading) {
    return <div>Loading Google configuration...</div>;
  }

  if (error) {
    return <div>Google configuration error: {error}</div>;
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
              <RouterProvider router={router} />
            </AuthProvider>
          </CurrencyProvider>
        </SettingsProvider>
      </ThemeProvider>
    </GoogleProviderWrapper>
  </StrictMode>
);
