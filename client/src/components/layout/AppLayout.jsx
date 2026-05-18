import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AuthModal from '../auth/AuthModal';

const PAGE_DATA = {
  '/markets': { title: 'Markets', subtitle: 'Browse all cryptocurrencies' },
  '/watchlist': { title: 'Watchlist', subtitle: 'Track your assets' },
  '/portfolio': { title: 'Portfolio', subtitle: 'Manage your holdings' },
  '/alerts': { title: 'Alerts', subtitle: 'Price notifications' },
  '/settings': { title: 'Settings', subtitle: 'App preferences' },
  '/settings/profile': { title: 'Profile', subtitle: 'Account settings' },
};

const PROTECTED_ROUTES = ['/watchlist', '/portfolio', '/alerts', '/settings', '/settings/profile'];
const VERIFY_PATH = '/verify-pending';

// Build the full path string including search and hash
function getCurrentPath(location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

// Main layout wrapper: sidebar + topbar + content outlet, handles auth gating on protected routes
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authRedirectTo, setAuthRedirectTo] = useState('/markets');

  const isLanding = location.pathname === '/';

  // Toggle sidebar between collapsed and expanded, persist to localStorage
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
    if (!loading && user && user.isVerified === false && location.pathname !== VERIFY_PATH) {
      navigate(VERIFY_PATH, { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  const { title, subtitle } = PAGE_DATA[location.pathname] || { title: 'Markets', subtitle: '' };

  const requiresAuth = PROTECTED_ROUTES.some(route => location.pathname.startsWith(route));
  const currentPath = getCurrentPath(location);
  const shouldShowProtectedAuth = !loading && requiresAuth && !user;
  const isAuthModalOpen = showAuthModal || shouldShowProtectedAuth;
  const activeAuthRedirectTo = shouldShowProtectedAuth ? currentPath : authRedirectTo;
  const activeAuthModalMode = shouldShowProtectedAuth ? 'login' : authModalMode;

  // Show the auth modal, remembering the current path for post-login redirect
  const handleShowAuth = useCallback((mode = 'login') => {
    setAuthRedirectTo(currentPath);
    setShowAuthModal(true);
    setAuthModalMode(mode);
  }, [currentPath]);

  if (loading) {
    return null;
  }

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base font-sans">
      {!isMobile && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {isMobile && sidebarOpen && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={false}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setShowAuthModal(false)}
          initialMode={activeAuthModalMode}
          redirectTo={activeAuthRedirectTo}
        />
      )}
    </div>
  );
}
