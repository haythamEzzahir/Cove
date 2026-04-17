import { LogoutIcon, SettingsIcon } from '../icons/SidebarIcons';
import { colors, radius, fontSize } from '../../styles/tokens';

/**
 * Sidebar
 * Left navigation panel.
 *
 * Props:
 *   items    {Array<{ icon, label, href, active }>}
 *   onNav    {(item) => void}  called when a nav item is clicked
 */
export default function Sidebar({ items = [], onNav }) {
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
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 4px 16px',
          borderBottom: `0.5px solid ${colors.borderDefault}`,
          marginBottom: 12,
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

      <span
        style={{
          fontSize: '10px',
          color: colors.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0 6px 6px',
        }}
      >
        Main Menu
      </span>

      {items.map((item) => (
        <NavItem key={item.label} item={item} onNav={onNav} />
      ))}

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `0.5px solid ${colors.borderDefault}` }}>
        <NavItem item={{ icon: <SettingsIcon />, label: 'Settings', href: '#' }} onNav={onNav} />
        <NavItem item={{ icon: <LogoutIcon />, label: 'Logout', href: '#' }} onNav={onNav} />
      </div>

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
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Unlock all features</p>
      </div>
    </nav>
  );
}

function NavItem({ item, onNav }) {
  const { icon, label, active } = item;

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
        color: active ? colors.blue : colors.textMuted,
        background: active ? colors.bgOverlay : 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors.bgOverlay;
          e.currentTarget.style.color = colors.textSecondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.textMuted;
        }
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <span
          style={{
            marginLeft: 'auto',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'currentColor',
          }}
        />
      )}
    </button>
  );
}
