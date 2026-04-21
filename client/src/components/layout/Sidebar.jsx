import { LogoutIcon, SettingsIcon } from '../icons/SidebarIcons';
import { colors, radius, fontSize } from '../../styles/tokens';

export default function Sidebar({ items = [], onNav, activePage = 'dashboard' }) {
  return (
    <nav
      style={{
        width: 192,
        flexShrink: 0,
        background: colors.bgSurface,
        borderRight: `0.5px solid ${colors.borderDefault}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        height: '100%',
        overflowY: 'auto',
        gap: 2,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 4px 16px',
          borderBottom: `0.5px solid ${colors.borderDefault}`,
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: colors.blue,
            borderRadius: radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          F
        </div>
        <span style={{ fontSize: fontSize.md, fontWeight: 600, color: colors.textPrimary }}>
          FinTracker
        </span>
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: '10px',
          color: colors.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0 6px 6px',
          flexShrink: 0,
        }}
      >
        Main Menu
      </span>

      {/* Nav items */}
      {items.map((item) => (
        <NavItem
          key={item.label}
          item={item}
          onNav={onNav}
          isActive={item.label.toLowerCase() === activePage}
        />
      ))}

      {/* Zone bas */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: `0.5px solid ${colors.borderDefault}`,
          flexShrink: 0,
        }}
      >
        <NavItem
          item={{ icon: <SettingsIcon />, label: 'Settings', href: '#' }}
          onNav={onNav}
          isActive={activePage === 'settings'}
        />
        <NavItem
          item={{ icon: <LogoutIcon />, label: 'Logout', href: '#' }}
          onNav={onNav}
          isActive={false}
        />

        <div
          style={{
            marginTop: 12,
            background: `linear-gradient(135deg, ${colors.blueDim}, ${colors.blue})`,
            borderRadius: radius.lg,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>Upgrade to Pro</p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            Unlock all features
          </p>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ item, onNav, isActive }) {
  const { icon, label } = item;

  return (
    <button
      onClick={() => onNav?.(item)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 10px',
        borderRadius: '6px',
        fontSize: '13px',
        cursor: 'pointer',
        color: isActive ? colors.blue : colors.textMuted,
        background: isActive ? colors.bgOverlay : 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = colors.bgOverlay;
          e.currentTarget.style.color = colors.textSecondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.textMuted;
        }
      }}
    >
      <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      <span>{label}</span>
      {isActive && (
        <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      )}
    </button>
  );
}