import { colors } from '../../styles/tokens';

// Renders a coin image or a colored circle with the first letter as fallback
export default function CoinLogo({ ticker = '', size = 28, image }) {
  const bg = colors.coin?.[ticker] ?? colors.blue;
  const letter = ticker?.charAt(0) || '?';

  if (image) {
    return (
      <img
        src={image}
        alt={ticker}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

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