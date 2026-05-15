import { StrictMode } from 'react';
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

console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <SettingsProvider>
          <CurrencyProvider>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </CurrencyProvider>
        </SettingsProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
