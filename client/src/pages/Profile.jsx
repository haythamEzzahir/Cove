import { useState } from 'react';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import { useSettings } from '../context/SettingsContext';

const INITIAL_PROFILE = {
  firstName: 'Ali',
  lastName: 'Karim',
  email: 'ali@cryptowatch.io',
  bio: 'Passionate crypto trader with 5+ years of experience in technical analysis and portfolio management. Focused on DeFi and long-term asset growth.',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactor: true,
  sessionAlerts: true,
};

const INITIAL_NOTIFS = {
  priceTargets: true,
  rapidVolatility: true,
  liquidations: false,
  trendingAssets: false,
  securityAlerts: true,
  productUpdates: true,
};

export default function Profile() {
  useSettings();
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [notifs, setNotifs]   = useState(INITIAL_NOTIFS);
  const [lastSaved, setLastSaved] = useState('10:42 AM');
  const [avatarUrl, setAvatarUrl] = useState(null);

  const set  = (key, val) => setProfile(p => ({ ...p, [key]: val }));
  const setN = (key, val) => setNotifs(n => ({ ...n, [key]: val }));

  const handleSave = () => {
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleDiscard = () => {
    setProfile(INITIAL_PROFILE);
    setNotifs(INITIAL_NOTIFS);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex-1 overflow-y-auto p-9">
        <section className="mb-8">
          <div className="flex items-start gap-2.5 mb-3.5">
            <span className="text-blue-500 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#e6edf3]">Personal Profile</h2>
              <p className="text-xs text-[#7d8590]">Update your personal details and how you appear to others.</p>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col gap-4.5">
            <div className="flex items-center gap-5">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#30363d] flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">AK</div>
                }
              </div>
              <div className="flex flex-wrap gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm font-medium text-[#e6edf3] cursor-pointer hover:bg-[#30363d] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-transparent bg-transparent text-sm font-medium text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => setAvatarUrl(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Remove
                </button>
                <span className="text-[11px] text-[#7d8590] w-full">JPG, GIF or PNG. Max size of 800K</span>
              </div>
            </div>

            <div className="h-px bg-[#30363d]" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c9d1d9]">First Name</label>
                <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" value={profile.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c9d1d9]">Last Name</label>
                <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" value={profile.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#c9d1d9]">Email Address</label>
              <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#c9d1d9]">Professional Bio</label>
              <textarea className="p-3 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500 resize-y leading-relaxed" rows={4} value={profile.bio} onChange={e => set('bio', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-start gap-2.5 mb-3.5">
            <span className="text-blue-500 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#e6edf3]">Security &amp; Access</h2>
              <p className="text-xs text-[#7d8590]">Manage your password, two-factor authentication, and session management.</p>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col gap-4.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#c9d1d9]">Current Password</label>
              <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="password" placeholder="••••••••" value={profile.currentPassword} onChange={e => set('currentPassword', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c9d1d9]">New Password</label>
                <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="password" placeholder="••••••••" value={profile.newPassword} onChange={e => set('newPassword', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c9d1d9]">Confirm Password</label>
                <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="password" placeholder="••••••••" value={profile.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>
            </div>

            <div className="h-px bg-[#30363d]" />

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-[#e6edf3] block mb-0.5">Two-Factor Authentication</span>
                <span className="text-xs text-[#7d8590]">Add an extra layer of security to your account.</span>
              </div>
              <ToggleSwitch checked={profile.twoFactor} onChange={v => set('twoFactor', v)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-[#e6edf3] block mb-0.5">Session Alerts</span>
                <span className="text-xs text-[#7d8590]">Get notified when a new session is started.</span>
              </div>
              <ToggleSwitch checked={profile.sessionAlerts} onChange={v => set('sessionAlerts', v)} />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-start gap-2.5 mb-3.5">
            <span className="text-blue-500 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#e6edf3]">Notification Channels</h2>
              <p className="text-xs text-[#7d8590]">Granular control over how and when you want to be notified.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-4">
              <div className="text-sm font-semibold text-[#e6edf3]">Trading Alerts</div>
              <div className="text-xs text-[#7d8590] -mt-3">Notifications about your market positions.</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">Price Targets</div>
                  <div className="text-xs text-[#7d8590]">When a coin hits your set price.</div>
                </div>
                <ToggleSwitch checked={notifs.priceTargets} onChange={v => setN('priceTargets', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">Rapid Volatility</div>
                  <div className="text-xs text-[#7d8590]">Significant swings (+/- 5%).</div>
                </div>
                <ToggleSwitch checked={notifs.rapidVolatility} onChange={v => setN('rapidVolatility', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">Liquidations</div>
                  <div className="text-xs text-[#7d8590]">Major market liquidation events.</div>
                </div>
                <ToggleSwitch checked={notifs.liquidations} onChange={v => setN('liquidations', v)} />
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col gap-4">
              <div className="text-sm font-semibold text-[#e6edf3]">News &amp; Updates</div>
              <div className="text-xs text-[#7d8590] -mt-3">Stay informed about the crypto world.</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">Trending Assets</div>
                  <div className="text-xs text-[#7d8590]">Weekly hot assets report.</div>
                </div>
                <ToggleSwitch checked={notifs.trendingAssets} onChange={v => setN('trendingAssets', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">Security Alerts</div>
                  <div className="text-xs text-[#7d8590]">Protocol hacks and risk warnings.</div>
                </div>
                <ToggleSwitch checked={notifs.securityAlerts} onChange={v => setN('securityAlerts', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#e6edf3]">Product Updates</div>
                  <div className="text-xs text-[#7d8590]">New features and API changes.</div>
                </div>
                <ToggleSwitch checked={notifs.productUpdates} onChange={v => setN('productUpdates', v)} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between gap-5 p-4.5 bg-[#161b22] border border-red-500/35 rounded-xl">
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <div className="text-sm font-semibold text-red-500">Deactivate Account</div>
                <div className="text-xs text-[#7d8590] max-w-[500px]">Permanently delete your account and all associated trading data. This action is irreversible.</div>
              </div>
            </div>
            <button className="px-5 rounded-lg border-none bg-red-500 text-white text-sm font-semibold cursor-pointer hover:opacity-85 transition-opacity flex-shrink-0">Delete Account</button>
          </div>
        </section>
      </div>

      <div className="flex-shrink-0 flex items-center justify-between p-3.5 bg-[#161b22] border-t border-[#30363d] gap-4">
        <div className="flex items-center gap-1.75 text-sm text-[#7d8590]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Last saved at {lastSaved}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="px-5 rounded-lg border border-[#30363d] bg-transparent text-sm font-medium text-[#c9d1d9] cursor-pointer hover:bg-[#1c2128] transition-colors" onClick={handleDiscard}>Discard Changes</button>
          <button className="px-5 rounded-lg border-none bg-blue-500 text-white text-sm font-semibold cursor-pointer hover:opacity-85 transition-opacity" onClick={handleSave}>Save Changes</button>
        </div>
      </div>

      <footer className="text-center text-xs text-[#7d8590] py-4 border-t border-[#21262d] flex justify-center gap-5">
        <span>© 2024 FinTracker Inc. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>
    </div>
  );
}