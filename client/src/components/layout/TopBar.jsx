import { colors, fontSize, radius } from '../../styles/tokens';

function ThemeIcon({ mode }) {
  if (mode === 'dark') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }

  return (
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
  );
}

/**
 * TopBar
 * Search bar + notification bell + user info.
 *
 * Props:
 *   placeholder  {string}
 *   user         {{ name, role, initials }}
 *   onSearch     {(query: string) => void}
 *   themeMode    {'dark'|'light'}
 *   onToggleTheme {() => void}
 */
export default function TopBar({
  placeholder = 'Search cryptocurrency (e.g. BTC, ETH)...',
  user,
  onSearch,
  themeMode = 'dark',
  onToggleTheme,
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        background: colors.bgSurface,
        borderBottom: `0.5px solid ${colors.borderDefault}`,
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: colors.bgBase,
          border: `0.5px solid ${colors.borderDefault}`,
          borderRadius: radius.md,
          padding: '7px 14px',
          flex: 1,
          maxWidth: 380,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: colors.textPrimary,
            fontSize: fontSize.base,
            width: '100%',
          }}
        />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            background: colors.bgBase,
            border: `0.5px solid ${colors.borderDefault}`,
            borderRadius: radius.full,
            cursor: 'pointer',
            color: colors.textMuted,
            width: 34,
            height: 34,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'color 0.15s, border-color 0.15s, background 0.15s',
          }}
        >
          <ThemeIcon mode={themeMode} />
        </button>

        {/* Bell */}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* User */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: colors.blue,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {user.initials}
            </div>
            <div>
              <p style={{ fontSize: fontSize.sm, fontWeight: 500, color: colors.textPrimary, lineHeight: 1.2 }}>{user.name}</p>
              <p style={{ fontSize: '10px', color: colors.textMuted, lineHeight: 1.2 }}>{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
