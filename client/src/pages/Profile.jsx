import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_AVATAR_SIZE = 800 * 1024;

const EMPTY_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  bio: '',
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

function splitName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function profileFromUser(user) {
  const { firstName, lastName } = splitName(user?.name || '');

  return {
    ...EMPTY_PROFILE,
    firstName,
    lastName,
    email: user?.email || '',
    bio: user?.bio || '',
  };
}

function getFullName(profile, user) {
  const name = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || user?.name || profile.email.split('@')[0] || 'User';
}

function getInitials(name, email) {
  const source = name || email || 'User';

  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

async function getJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getInitialLastSaved(user) {
  return user?.updatedAt
    ? new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not saved yet';
}

export default function Profile() {
  useSettings();
  const { user, token, loading, logout, updateCurrentUser } = useAuth();

  if (!loading && !user) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d1117] text-[#e6edf3] p-9">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 max-w-md text-center">
          <h2 className="text-base font-semibold mb-2">Profile unavailable</h2>
          <p className="text-sm text-[#7d8590]">Please sign in to view and update your account details.</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileEditor
      key={user?._id || user?.email || 'loading'}
      user={user}
      token={token}
      logout={logout}
      updateCurrentUser={updateCurrentUser}
    />
  );
}

function ProfileEditor({ user, token, logout, updateCurrentUser }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [notifs, setNotifs]   = useState(INITIAL_NOTIFS);
  const [lastSaved, setLastSaved] = useState(() => getInitialLastSaved(user));
  const [avatarUrl, setAvatarUrl] = useState(() => user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const displayName = useMemo(() => getFullName(profile, user), [profile, user]);
  const initials = useMemo(() => getInitials(displayName, profile.email), [displayName, profile.email]);

  const set  = (key, val) => setProfile(p => ({ ...p, [key]: val }));
  const setN = (key, val) => setNotifs(n => ({ ...n, [key]: val }));

  const handleSave = async () => {
    if (!token) {
      setError('Please sign in to save your profile.');
      return;
    }

    if (!profile.email.trim()) {
      setError('Email is required.');
      return;
    }

    if ((profile.currentPassword || profile.newPassword || profile.confirmPassword)
      && profile.newPassword !== profile.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSaving(true);
    setError('');
    setStatus('');

    const payload = {
      name: getFullName(profile, user),
      email: profile.email.trim(),
      bio: profile.bio.trim(),
    };

    if (!avatarUrl.startsWith('blob:')) {
      payload.avatar = avatarUrl;
    }

    if (profile.currentPassword || profile.newPassword || profile.confirmPassword) {
      payload.currentPassword = profile.currentPassword;
      payload.newPassword = profile.newPassword;
      payload.confirmPassword = profile.confirmPassword;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await getJson(response);

      if (response.status === 401) {
        logout();
        setError('Your session expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        setError(data.message || 'Failed to save profile.');
        return;
      }

      updateCurrentUser(data);
      setProfile(profileFromUser(data));
      setAvatarUrl(data.avatar || '');
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setStatus('Profile saved.');
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setProfile(profileFromUser(user));
    setAvatarUrl(user?.avatar || '');
    setNotifs(INITIAL_NOTIFS);
    setError('');
    setStatus('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Avatar image must be 800K or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = () => {
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;

    setShowDeleteModal(false);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    const authToken = localStorage.getItem('token') || token;

    if (!authToken) {
      setDeleteError('Please sign in again before deleting your account.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    setStatus('');

    try {
      const response = await fetch(`${API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await getJson(response);

      if (!response.ok) {
        setDeleteError(data.message || 'Failed to delete account.');
        return;
      }

      localStorage.removeItem('fintracker_user');
      localStorage.removeItem('fintracker_watchlist');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      logout();
      navigate('/login', { replace: true });
    } catch (deleteError) {
      console.error('Delete account error:', deleteError);
      setDeleteError(deleteError.message || 'Server error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
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
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-sm text-red-400">
                {error}
              </div>
            )}
            {status && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3.5 py-2 text-sm text-green-400">
                {status}
              </div>
            )}
            <div className="flex items-center gap-5">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[#30363d] flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">{initials}</div>
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
                <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-transparent bg-transparent text-sm font-medium text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => setAvatarUrl('')}>
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
              <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="password" placeholder="********" value={profile.currentPassword} onChange={e => set('currentPassword', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c9d1d9]">New Password</label>
                <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="password" placeholder="********" value={profile.newPassword} onChange={e => set('newPassword', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#c9d1d9]">Confirm Password</label>
                <input className="h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#1c2128] text-sm text-[#e6edf3] outline-none focus:border-blue-500" type="password" placeholder="********" value={profile.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
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
            <button
              className="px-5 rounded-lg border-none bg-red-500 text-white text-sm font-semibold cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
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
          <button className="px-5 rounded-lg border-none bg-blue-500 text-white text-sm font-semibold cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
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

      <DeleteAccountModal
        open={showDeleteModal}
        deleting={isDeleting}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function DeleteAccountModal({ open, deleting, error, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/35 bg-[#161b22] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-red-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#e6edf3]">Delete Account</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#7d8590]">
              This action is irreversible. Your profile and all associated account data will be permanently deleted.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            className="h-10 rounded-lg border border-[#30363d] bg-transparent px-5 text-sm font-medium text-[#c9d1d9] transition-colors hover:bg-[#1c2128] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-lg border-none bg-red-500 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
