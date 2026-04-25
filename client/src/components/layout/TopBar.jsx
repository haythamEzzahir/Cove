import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';

export default function TopBar({
  pageTitle = 'Dashboard',
  pageSubtitle,
  onToggleSidebar,
  onShowAuth,
}) {
  const { user, logout } = useAuth();
  const { currency, setCurrency, currencies, currencyData } = useCurrency();
  const { toggleTheme, isDark } = useTheme();
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-default bg-surface sticky top-0 z-10 gap-3">
      {/* Burger button - only visible on mobile */}
      <button
        onClick={onToggleSidebar}
        className="p-2 cursor-pointer bg-transparent border-none text-muted lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Title - centered */}
      <div className="flex-1 text-center lg:flex-none lg:text-left">
        <h1 className="text-lg sm:text-xl font-bold text-primary leading-tight">{pageTitle}</h1>
        {pageSubtitle && (
          <p className="text-xs text-muted mt-0.5 leading-tight hidden sm:block">{pageSubtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-default bg-base text-primary text-sm font-medium cursor-pointer"
          >
            <span>{currencyData.symbol}</span>
            <span className="uppercase">{currency}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showCurrencyMenu && (
            <div className="absolute top-full right-0 mt-1 min-w-[160px] bg-surface border border-default rounded-md p-1 z-50">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setShowCurrencyMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm cursor-pointer border-none text-left ${currency === c.code ? 'bg-accent text-white' : 'text-primary hover:bg-overlay'}`}
                >
                  <span>{c.symbol}</span>
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs uppercase opacity-70">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle - shows moon in dark mode (click for light), shows sun in light mode (click for dark) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 cursor-pointer rounded-lg border border-default bg-surface text-primary hover:bg-overlay"
        >
          {isDark ? (
            // Moon icon - click to switch to light mode
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2.5" />
              <path d="M12 19.5V22" />
              <path d="m4.93 4.93 1.77 1.77" />
              <path d="m17.3 17.3 1.77 1.77" />
              <path d="M2 12h2.5" />
              <path d="M19.5 12H22" />
              <path d="m4.93 19.07 1.77-1.77" />
              <path d="m17.3 6.7 1.77-1.77" />
            </svg>
          ) : (
            // Sun icon - click to switch to dark mode
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>

        <button className="p-1 cursor-pointer bg-transparent border-none text-muted hidden sm:block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white">
              {user.initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-primary leading-tight">{user.name}</p>
              <p className="text-xs text-muted leading-tight">Pro Trader</p>
            </div>
            <button 
              onClick={logout}
              className="text-xs text-muted hover:text-danger bg-transparent border-none cursor-pointer"
              title="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onShowAuth('login')}
              className="no-underline text-sm font-medium text-secondary px-2 sm:px-3 py-2 bg-transparent border-none cursor-pointer hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={() => onShowAuth('signup')}
              className="no-underline text-sm font-semibold text-white bg-accent px-3 sm:px-4 py-2 rounded-md border-none cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}