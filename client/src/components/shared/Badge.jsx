import { colors } from '../../styles/tokens';

/**
 * Badge
 * Colored pill for change percentages and status labels.
 *
 * Props:
 *   variant   {'green' | 'red' | 'yellow' | 'blue' | 'neutral'}
 *   children  {ReactNode}
 */
const variants = {
  green:   { bg: colors.greenBg,   text: colors.green  },
  red:     { bg: colors.redBg,     text: colors.red    },
  yellow:  { bg: colors.yellowBg,  text: colors.yellow },
  blue:    { bg: 'rgba(59,130,246,0.2)', text: colors.blue },
  neutral: { bg: colors.bgOverlay, text: colors.textMuted },
};

// Colored pill badge for change percentages and status labels
export default function Badge({ variant = 'neutral', children, style = {} }) {
  const { bg, text } = variants[variant] ?? variants.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: text,
        fontSize: '11px',
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: '4px',
        lineHeight: 1.6,
        ...style,
      }}
    >
      {children}
    </span>
  );
}