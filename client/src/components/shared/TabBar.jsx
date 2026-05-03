import { radius } from '../../styles/tokens';
import { useTheme } from '../../context/ThemeContext';

/**
 * TabBar
 * Horizontal pill-style tab switcher.
 *
 * Props:
 *   tabs      {string[]}           list of tab labels
 *   active    {string}             currently active tab
 *   onChange  {(tab: string)=>void}
 *   size      {'sm' | 'md'}
 */
export default function TabBar({ tabs = [], active, onChange, size = 'sm' }) {
  const { isDark } = useTheme();
  const pad   = size === 'sm' ? '3px 9px' : '5px 14px';
  const fsize = size === 'sm' ? '11px' : '13px';
  const bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange?.(tab)}
            style={{
              padding: pad,
              fontSize: fsize,
              fontWeight: 600,
              borderRadius: radius.md,
              border: isActive ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              background: isActive ? 'rgb(var(--color-primary))' : 'transparent',
              color: isActive ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = bg;
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}