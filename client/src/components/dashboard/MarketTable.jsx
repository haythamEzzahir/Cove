import Badge from '../shared/Badge';
import { colors, radius, fontSize } from '../../styles/tokens';

/**
 * MetricCard
 * Summary stat card shown in the top metrics row.
 *
 * Props:
 *   icon    {string}          emoji or react element
 *   label   {string}          e.g. "Market Cap"
 *   value   {string}          formatted value e.g. "$2.64T"
 *   change  {number|null}     percent change — positive = green, negative = red, null = hide
 *   badge   {string|null}     override badge text (e.g. "Greed")
 */
export default function MetricCard({ icon, label, value, change, badge }) {
  const variant = change == null ? 'neutral' : change >= 0 ? 'green' : 'red';
  const badgeText = badge ?? (change != null ? `${change >= 0 ? '+' : ''}${change}%` : null);

  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `0.5px solid ${colors.borderDefault}`,
        borderRadius: radius.lg,
        padding: '14px 16px',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
          fontSize: fontSize.xs,
          color: colors.textMuted,
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        {label}
      </div>

      {/* Value + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: fontSize.xl, fontWeight: 600, color: colors.textPrimary }}>
          {value}
        </span>
        {badgeText && <Badge variant={variant}>{badgeText}</Badge>}
      </div>
    </div>
  );
}