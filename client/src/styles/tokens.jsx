export const colors = {
  bgBase: '#0d1117',
  bgSurface: '#161b22',
  bgOverlay: '#1c2128',
  borderSubtle: '#21262d',
  borderDefault: '#30363d',
  borderStrong: '#484f58',
  textPrimary: '#e6edf3',
  textSecondary: '#c9d1d9',
  textMuted: '#7d8590',
  blue: '#3b82f6',
  blueDim: '#1f6feb',
  green: '#3fb950',
  greenBg: 'rgba(35, 134, 54, 0.2)',
  red: '#f85149',
  redBg: 'rgba(248, 81, 73, 0.2)',
  yellow: '#d29922',
  yellowBg: 'rgba(187, 128, 9, 0.2)',
  coin: {
    BTC: '#F7931A',
    ETH: '#627EEA',
    SOL: '#9945FF',
    LINK: '#2A5ADA',
    ADA: '#0033AD',
    AVAX: '#E84142',
    DOT: '#E6007A',
    UNI: '#FF007A',
    MATIC: '#8247E5',
    LTC: '#BFBBBB',
    ATOM: '#2E3148',
    XRP: '#00AAE4',
    DOGE: '#C2A633',
    BNB: '#F3BA2F',
    USDC: '#2775CA',
    USDT: '#26A17B',
  },
};

export const radius = {
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px',
};

export const fontSize = {
  xs: '11px',
  sm: '13px',
  md: '14px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
};

export function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.style.setProperty('--color-bg-base', '#0d1117');
    document.documentElement.style.setProperty('--color-bg-surface', '#161b22');
    document.documentElement.style.setProperty('--color-bg-overlay', '#1c2128');
    document.documentElement.style.setProperty('--color-border-subtle', '#21262d');
    document.documentElement.style.setProperty('--color-border-default', '#30363d');
    document.documentElement.style.setProperty('--color-text-primary', '#e6edf3');
    document.documentElement.style.setProperty('--color-text-secondary', '#c9d1d9');
    document.documentElement.style.setProperty('--color-text-muted', '#7d8590');
    document.documentElement.style.setProperty('--color-blue', '#3b82f6');
    document.documentElement.style.setProperty('--color-green', '#3fb950');
    document.documentElement.style.setProperty('--color-red', '#f85149');
  } else {
    document.documentElement.style.setProperty('--color-bg-base', '#ffffff');
    document.documentElement.style.setProperty('--color-bg-surface', '#f6f8fa');
    document.documentElement.style.setProperty('--color-bg-overlay', '#f6f8fa');
    document.documentElement.style.setProperty('--color-border-subtle', '#d0d7de');
    document.documentElement.style.setProperty('--color-border-default', '#d0d7de');
    document.documentElement.style.setProperty('--color-text-primary', '#1f2328');
    document.documentElement.style.setProperty('--color-text-secondary', '#656d76');
    document.documentElement.style.setProperty('--color-text-muted', '#8b949e');
    document.documentElement.style.setProperty('--color-blue', '#0969da');
    document.documentElement.style.setProperty('--color-green', '#1a7f37');
    document.documentElement.style.setProperty('--color-red', '#cf222e');
  }
}