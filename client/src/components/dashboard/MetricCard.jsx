export default function MetricCard({ label, value, change, badge }) {
  const isFearGreed = label?.includes('Fear');
  const variant = change == null ? 'neutral' : change >= 0 ? 'green' : 'red';
  const badgeText = badge ?? (change != null ? `${change >= 0 ? '+' : ''}${change}%` : null);

  let badgeStyle = {};
  
  if (isFearGreed && badge) {
    const score = parseInt(badge.split('/')[0]) || 50;
    if (score <= 35) {
      badgeStyle = { background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.25)' };
    } else if (score <= 65) {
      badgeStyle = { background: 'rgba(255,200,0,0.15)', color: '#ffc800', border: '1px solid rgba(255,200,0,0.25)' };
    } else {
      badgeStyle = { background: 'rgba(0,255,136,0.15)', color: '#00e676', border: '1px solid rgba(0,255,136,0.25)' };
    }
  } else if (variant === 'green') {
    badgeStyle = { background: 'rgba(0,255,136,0.12)', color: '#00e676', border: '1px solid rgba(0,255,136,0.2)' };
  } else if (variant === 'red') {
    badgeStyle = { background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.2)' };
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 min-w-[140px] flex-shrink-0">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
        {badgeText && (
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={badgeStyle}>{badgeText}</span>
        )}
      </div>
      <div className="text-xl sm:text-2xl lg:text-[26px] font-mono font-medium text-white leading-tight truncate">
        {value}
      </div>
    </div>
  );
}