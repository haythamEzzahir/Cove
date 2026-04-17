import { colors, radius } from '../../styles/tokens';

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
  const pad   = size === 'sm' ? '3px 9px' : '5px 14px';
  const fsize = size === 'sm' ? '11px' : '13px';

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
              fontWeight: 500,
              borderRadius: radius.md,
              border: isActive ? 'none' : `0.5px solid ${colors.borderDefault}`,
              background: isActive ? colors.blue : 'transparent',
              color: isActive ? '#fff' : colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}