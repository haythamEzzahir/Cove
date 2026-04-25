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

export default function AppLayout() {
  const location = useLocation();
  const { settings, updateSetting } = useSettings();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

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

  if (loading) {
    return null;
  }

  const requiresAuth = PROTECTED_ROUTES.some(route => location.pathname.startsWith(route));
  
  if (requiresAuth && !user) {
    if (!showAuthModal) {
      setShowAuthModal(true);
      setAuthModalMode('login');
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base font-sans">
      {(!isMobile || sidebarOpen) && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          pageTitle={title}
          pageSubtitle={subtitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onShowAuth={() => { setShowAuthModal(true); setAuthModalMode('login'); }}
        />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authModalMode}
      />
    </div>
  );
}