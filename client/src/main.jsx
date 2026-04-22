import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'markets', element: <Dashboard /> },
      { path: 'watchlist', element: <Watchlist /> },
      { path: 'portfolio', element: <Dashboard /> },
      { path: 'alerts', element: <Dashboard /> },
      { path: 'news', element: <Dashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'settings/profile', element: <Profile /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  </StrictMode>
);