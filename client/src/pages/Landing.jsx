import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TICKER = [
  ['BTC', '$67,432', '+2.3%'],
  ['ETH', '$3,456', '+1.1%'],
  ['SOL', '$148.23', '-0.8%'],
  ['ADA', '$0.45', '+5.2%'],
  ['DOT', '$7.89', '+3.4%'],
  ['AVAX', '$35.67', '-2.1%'],
  ['LINK', '$14.23', '+0.5%'],
  ['DOGE', '$0.12', '+1.8%'],
];

// Landing page: scrolling ticker, 3D card hero, feature grid, and CTA
export default function Landing() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const tickerRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onMove = (e) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden font-sans selection:bg-zinc-700 selection:text-white">
      {/* Custom cursor dot */}
      <div
        className="fixed w-3 h-3 bg-white/20 rounded-full pointer-events-none z-50 mix-blend-difference hidden sm:block"
        style={{
          left: cursor.x - 6,
          top: cursor.y - 6,
          transition: 'all 0.08s ease-out',
        }}
      />

      {/* Scrolling ticker tape */}
      <div className="relative z-20 bg-zinc-900 border-b border-zinc-800 overflow-hidden h-8">
        <div className="flex animate-scroll whitespace-nowrap" ref={tickerRef}>
          {[...Array(4)].map((_, loop) =>
            TICKER.map(([coin, price, change], i) => (
              <span key={`${loop}-${i}`} className="inline-flex items-center gap-2 mx-4 text-xs leading-[32px]">
                <span className="font-semibold text-zinc-300">{coin}</span>
                <span className="text-zinc-400">{price}</span>
                <span className={change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>{change}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
              </span>
            ))
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
            <path d="M26 26C26 18 22 5 16 5C10 5 6 18 6 26" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="14" r="3" fill="#10b981"/>
          </svg>
          <span className="text-lg font-bold tracking-tight text-white">Cove</span>
          <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">v2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/markets')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-all cursor-pointer"
          >
            Launch →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-500 font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>market is live</span>
              <span className="text-zinc-700">—</span>
              <span className="text-zinc-600">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })} UTC</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              stop guessing,
              <br />
              <span className="text-zinc-500 relative">
                start
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-zinc-800" />
              </span>{' '}
              <span className="italic">watching</span>.
            </h1>

            <p className="mt-5 text-sm text-zinc-500 max-w-md leading-relaxed">
              One place for prices, portfolio, and alerts. No fluff, no noise — just the data you actually need.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-2.5 mt-8">
              <button
                onClick={() => navigate('/markets')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-all cursor-pointer flex items-center gap-2"
              >
                Explore markets
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none"
              >
                Create account →
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-10 pt-6 border-t border-zinc-900">
              {[
                ['2.4M+', 'coins tracked'],
                ['$4.2B', 'volume'],
                ['99.9%', 'uptime'],
              ].map(([val, label]) => (
                <div key={label}>
                  <div className="text-sm font-semibold text-white">{val}</div>
                  <div className="text-[11px] text-zinc-600">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — staggered card stack */}
          <div className="relative hidden lg:block" style={{ perspective: '800px' }}>
            <div
              className="relative"
              style={{
                transform: `rotateY(${(cursor.x / window.innerWidth - 0.5) * 6}deg) rotateX(${(cursor.y / window.innerHeight - 0.5) * -4}deg)`,
                transition: 'transform 0.15s ease-out',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Card 1 */}
              <div className="relative z-30 bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full max-w-sm mx-auto shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">B</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Bitcoin</div>
                      <div className="text-[10px] font-mono text-zinc-600">BTC</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">$67,432</div>
                    <div className="text-[10px] text-emerald-400">+2.3%</div>
                  </div>
                </div>
                <div className="h-12 flex items-end gap-[2px]">
                  {[40, 55, 45, 60, 70, 55, 75, 65, 80, 72, 65, 78, 82, 76, 68, 74, 85, 79, 72, 68].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-emerald-500/70"
                      style={{ height: `${h}%`, opacity: 0.3 + (h / 85) * 0.7 }}
                    />
                  ))}
                </div>
              </div>

              {/* Card 2 (offset) */}
              <div className="relative z-20 -mt-4 ml-8 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 w-[90%] max-w-sm shadow-xl shadow-black/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {['E', 'S', 'A'].map((l) => (
                        <div key={l} className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-400">{l}</div>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">Watchlist</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">+3 coins</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">ETH</span>
                  <span className="text-white font-medium">$3,456</span>
                  <span className="text-emerald-400">+1.1%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="text-zinc-400">SOL</span>
                  <span className="text-white font-medium">$148</span>
                  <span className="text-red-400">-0.8%</span>
                </div>
              </div>

              {/* Card 3 (further offset) */}
              <div className="relative z-10 -mt-4 ml-16 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 w-[80%] max-w-sm shadow-lg shadow-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-zinc-500">
                    <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.1c0 .45-.13.89-.37 1.27L5.75 15h12.5l-1.38-2.63a2.7 2.7 0 0 1-.37-1.27V9A4.5 4.5 0 0 0 12 4.5Z" />
                    <path d="M10 18a2 2 0 0 0 4 0" />
                  </svg>
                  <span className="text-zinc-500">Alert: BTC above $70k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — irregular grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[11px] font-mono text-zinc-700">//</span>
          <span className="text-[11px] font-mono text-zinc-600">what you get</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              title: 'Live prices',
              desc: 'Real-time data from the market. No delay, no refresh needed.',
              extra: '60+ exchanges',
            },
            {
              title: 'Watchlist',
              desc: 'Star the coins that matter and keep them front and center.',
              extra: 'unlimited',
            },
            {
              title: 'Portfolio',
              desc: 'Track what you own. See your P&L at a glance.',
              extra: 'multi-wallet',
            },
            {
              title: 'Alerts',
              desc: 'Set thresholds. Get notified. Never miss a move.',
              extra: 'push + email',
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`group p-4 rounded-xl border transition-all duration-300 bg-zinc-900/30 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700 ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''} ${i === 1 ? 'sm:col-span-2 lg:col-span-1' : ''} ${i === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              style={i === 3 ? { marginTop: 0 } : {}}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <span className="text-[10px] font-mono text-zinc-700 bg-zinc-800/50 px-1.5 py-0.5 rounded">{f.extra}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-center gap-3 mt-10 pt-8 border-t border-zinc-900">
          <div className="flex -space-x-1.5">
            {['#', '$', '~', '+', '^'].map((s, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#0d0d0d] flex items-center justify-center text-[10px] text-zinc-500 font-mono">{s}</div>
            ))}
          </div>
          <span className="text-xs text-zinc-600">
            <span className="text-zinc-500 font-semibold">5,000+</span> traders already onboard
          </span>
        </div>
      </section>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
