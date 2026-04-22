// src/pages/Profile.jsx
import { useState } from 'react';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import { useSettings } from '../context/SettingsContext';
import '../styles/profile.css';

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
    <div className="profile-page">

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="profile-scroll">

        {/* ── Personal Profile ── */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <div>
              <h2 className="profile-section-title">Personal Profile</h2>
              <p className="profile-section-desc">Update your personal details and how you appear to others.</p>
            </div>
          </div>

          <div className="profile-card-box">
            {/* Avatar */}
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrap">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
                  : <div className="profile-avatar-initials">AK</div>
                }
              </div>
              <div className="profile-avatar-actions">
                <label className="btn-change-photo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
                <button className="btn-remove-photo" onClick={() => setAvatarUrl(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Remove
                </button>
                <span className="profile-avatar-hint">JPG, GIF or PNG. Max size of 800K</span>
              </div>
            </div>

            <div className="profile-divider" />

            <div className="profile-form-row">
              <div className="profile-form-group">
                <label className="profile-label">First Name</label>
                <input className="profile-input" value={profile.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Last Name</label>
                <input className="profile-input" value={profile.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Email Address</label>
              <input className="profile-input" type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Professional Bio</label>
              <textarea className="profile-textarea" rows={4} value={profile.bio} onChange={e => set('bio', e.target.value)} />
            </div>
          </div>
        </section>

        {/* ── Security & Access ── */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <div>
              <h2 className="profile-section-title">Security &amp; Access</h2>
              <p className="profile-section-desc">Manage your password, two-factor authentication, and session management.</p>
            </div>
          </div>

          <div className="profile-card-box">
            <div className="profile-form-group">
              <label className="profile-label">Current Password</label>
              <input className="profile-input" type="password" placeholder="••••••••"
                value={profile.currentPassword} onChange={e => set('currentPassword', e.target.value)} />
            </div>
            <div className="profile-form-row">
              <div className="profile-form-group">
                <label className="profile-label">New Password</label>
                <input className="profile-input" type="password" placeholder="••••••••"
                  value={profile.newPassword} onChange={e => set('newPassword', e.target.value)} />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Confirm Password</label>
                <input className="profile-input" type="password" placeholder="••••••••"
                  value={profile.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>
            </div>

            <div className="profile-divider" />

            <div className="profile-toggle-row">
              <div>
                <span className="profile-toggle-label">Two-Factor Authentication</span>
                <span className="profile-toggle-desc">Add an extra layer of security to your account.</span>
              </div>
              <ToggleSwitch checked={profile.twoFactor} onChange={v => set('twoFactor', v)} />
            </div>
            <div className="profile-toggle-row">
              <div>
                <span className="profile-toggle-label">Session Alerts</span>
                <span className="profile-toggle-desc">Get notified when a new session is started.</span>
              </div>
              <ToggleSwitch checked={profile.sessionAlerts} onChange={v => set('sessionAlerts', v)} />
            </div>
          </div>
        </section>

        {/* ── Notification Channels ── */}
        <section className="profile-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <div>
              <h2 className="profile-section-title">Notification Channels</h2>
              <p className="profile-section-desc">Granular control over how and when you want to be notified.</p>
            </div>
          </div>

          <div className="profile-notif-grid">
            <div className="profile-notif-col">
              <div className="profile-notif-col-title">Trading Alerts</div>
              <div className="profile-notif-col-desc">Notifications about your market positions.</div>
              <div className="profile-notif-item">
                <div>
                  <div className="profile-toggle-label">Price Targets</div>
                  <div className="profile-toggle-desc">When a coin hits your set price.</div>
                </div>
                <ToggleSwitch checked={notifs.priceTargets} onChange={v => setN('priceTargets', v)} />
              </div>
              <div className="profile-notif-item">
                <div>
                  <div className="profile-toggle-label">Rapid Volatility</div>
                  <div className="profile-toggle-desc">Significant swings (+/- 5%).</div>
                </div>
                <ToggleSwitch checked={notifs.rapidVolatility} onChange={v => setN('rapidVolatility', v)} />
              </div>
              <div className="profile-notif-item">
                <div>
                  <div className="profile-toggle-label">Liquidations</div>
                  <div className="profile-toggle-desc">Major market liquidation events.</div>
                </div>
                <ToggleSwitch checked={notifs.liquidations} onChange={v => setN('liquidations', v)} />
              </div>
            </div>

            <div className="profile-notif-col">
              <div className="profile-notif-col-title">News &amp; Updates</div>
              <div className="profile-notif-col-desc">Stay informed about the crypto world.</div>
              <div className="profile-notif-item">
                <div>
                  <div className="profile-toggle-label">Trending Assets</div>
                  <div className="profile-toggle-desc">Weekly hot assets report.</div>
                </div>
                <ToggleSwitch checked={notifs.trendingAssets} onChange={v => setN('trendingAssets', v)} />
              </div>
              <div className="profile-notif-item">
                <div>
                  <div className="profile-toggle-label">Security Alerts</div>
                  <div className="profile-toggle-desc">Protocol hacks and risk warnings.</div>
                </div>
                <ToggleSwitch checked={notifs.securityAlerts} onChange={v => setN('securityAlerts', v)} />
              </div>
              <div className="profile-notif-item">
                <div>
                  <div className="profile-toggle-label">Product Updates</div>
                  <div className="profile-toggle-desc">New features and API changes.</div>
                </div>
                <ToggleSwitch checked={notifs.productUpdates} onChange={v => setN('productUpdates', v)} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Deactivate Account ── */}
        <section className="profile-section">
          <div className="profile-danger-box">
            <div className="profile-danger-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <div className="profile-danger-title">Deactivate Account</div>
                <div className="profile-danger-desc">Permanently delete your account and all associated trading data. This action is irreversible.</div>
              </div>
            </div>
            <button className="btn-delete-account">Delete Account</button>
          </div>
        </section>

      </div>

      {/* ── FOOTER FIXE ── */}
      <div className="profile-footer">
        <div className="profile-footer-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Last saved at {lastSaved}</span>
        </div>
        <div className="profile-footer-right">
          <button className="btn-discard" onClick={handleDiscard}>Discard Changes</button>
          <button className="btn-save" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}