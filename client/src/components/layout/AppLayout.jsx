import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AuthModal from '../auth/AuthModal';

const PAGE_DATA = {
  '/': { title: 'Dashboard', subtitle: 'Live market feed' },
  '/markets': { title: 'Markets', subtitle: 'Browse all cryptocurrencies' },
  '/watchlist': { title: 'Watchlist', subtitle: 'Track your assets' },
  '/portfolio': { title: 'Portfolio', subtitle: 'Manage your holdings' },
  '/alerts': { title: 'Alerts', subtitle: 'Price notifications' },
  '/news': { title: 'News', subtitle: 'Latest crypto news' },
  '/settings': { title: 'Settings', subtitle: 'App preferences' },
  '/settings/profile': { title: 'Profile', subtitle: 'Account settings' },
};

const PROTECTED_ROUTES = ['/watchlist', '/portfolio', '/alerts', '/news', '/settings', '/settings/profile'];
const AUTH_REDIRECT_KEY = 'fintracker_auth_redirect';

function getCurrentPath(location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

export default function AppLayout() {
  const location = useLocation();
  const { settings, updateSetting } = useSettings();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authRedirectTo, setAuthRedirectTo] = useState('/');

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', newState.toString());
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const { title, subtitle } = PAGE_DATA[location.pathname] || { title: 'Dashboard', subtitle: '' };

  const handleToggleTheme = () => {
    updateSetting('darkMode', !settings.darkMode);
  };

  const requiresAuth = PROTECTED_ROUTES.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    if (!loading && requiresAuth && !user) {
      const requestedPath = getCurrentPath(location);
      sessionStorage.setItem(AUTH_REDIRECT_KEY, requestedPath);
      setAuthRedirectTo(requestedPath);
      setAuthModalMode('login');
      setShowAuthModal(true);
    }
  }, [loading, location, requiresAuth, user]);

  const handleShowAuth = (mode = 'login') => {
    const requestedPath = getCurrentPath(location);
    sessionStorage.setItem(AUTH_REDIRECT_KEY, requestedPath);
    setAuthRedirectTo(requestedPath);
    setShowAuthModal(true);
    setAuthModalMode(mode);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base font-sans">
      {/* Sidebar */}
      {!isMobile && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}
      
      {/* Mobile sidebar */}
      {isMobile && sidebarOpen && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          collapsed={false}
          onToggleCollapse={toggleSidebar}
        />
      )}
      
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div 
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? '56px' : '220px') }}
      >
        <TopBar
          pageTitle={title}
          pageSubtitle={subtitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onShowAuth={handleShowAuth}
        />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authModalMode}
        redirectTo={authRedirectTo}
      />
    </div>
  );
}
