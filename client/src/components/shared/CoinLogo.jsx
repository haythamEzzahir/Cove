import { colors } from '../../styles/tokens';

/**
 * CoinLogo
 * Circular coin avatar. Uses brand color from tokens or falls back to blue.
 *
 * Props:
 *   ticker  {string}  e.g. "BTC"
 *   size    {number}  diameter in px (default 28)
 */
export default function CoinLogo({ ticker = '?', size = 28 }) {
  const bg = colors.coin[ticker] ?? colors.blue;
  const letter = ticker.charAt(0);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}