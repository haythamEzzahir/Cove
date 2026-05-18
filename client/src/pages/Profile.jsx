import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from '../components/settings/ToggleSwitch';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_AVATAR_SIZE = 800 * 1024;

const sectionTitleClass = 'text-base font-semibold text-primary';
const sectionDescriptionClass = 'text-xs text-muted';
const panelClass = 'bg-surface border border-default rounded-xl p-5 sm:p-6 flex flex-col gap-4';
const compactPanelClass = 'bg-surface border border-default rounded-xl p-5 flex flex-col gap-4';
const labelClass = 'text-sm font-medium text-secondary';
const fieldClass = 'h-10 px-3.5 rounded-lg border border-default bg-overlay text-sm text-primary outline-none focus:border-[rgb(var(--color-primary))] transition-colors';
const textareaClass = 'p-3 rounded-lg border border-default bg-overlay text-sm text-primary outline-none focus:border-[rgb(var(--color-primary))] resize-y leading-relaxed transition-colors';
const dividerClass = 'h-px bg-[rgb(var(--border-default))]';
const itemTitleClass = 'text-sm font-medium text-primary';
const itemDescriptionClass = 'text-xs text-muted';
const secondaryButtonClass = 'cursor-pointer rounded-lg border border-default bg-transparent px-5 text-sm font-medium text-secondary transition-colors hover:bg-overlay disabled:cursor-not-allowed disabled:opacity-50';

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
    avatar: user?.avatar || '',
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
  const { user, loading, logout, updateCurrentUser } = useAuth();

  if (!loading && !user) {
    return (
      <div className="flex h-full items-center justify-center bg-base text-primary p-4 sm:p-9">
        <div className="bg-surface border border-default rounded-xl p-6 max-w-md text-center">
          <h2 className="text-base font-semibold mb-2">Profile unavailable</h2>
          <p className="text-sm text-muted">Please sign in to view and update your account details.</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileEditor
      key={user?._id || user?.email || 'loading'}
      user={user}
      logout={logout}
      updateCurrentUser={updateCurrentUser}
    />
  );
}

function ProfileEditor({ user, logout, updateCurrentUser }) {
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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
    if (!user) {
      setDeleteError('Please sign in again before deleting your account.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    setStatus('');

    try {
      const response = await fetch(`${API_URL}/api/auth/account`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await getJson(response);

      if (!response.ok) {
        setDeleteError(data.message || 'Failed to delete account.');
        return;
      }

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
    <div className="flex h-full flex-col bg-base text-primary">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-9">
        <section className="mb-8">
          <div className="flex items-start gap-2.5 mb-3.5">
            <span className="text-blue-500 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <div>
              <h2 className={sectionTitleClass}>Personal Profile</h2>
              <p className={sectionDescriptionClass}>Update your personal details and how you appear to others.</p>
            </div>
          </div>

          <div className={panelClass}>
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
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-default flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-accent text-white flex items-center justify-center text-xl font-bold">{initials}</div>
                }
              </div>
              <div className="flex flex-wrap gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-default bg-overlay text-sm font-medium text-primary cursor-pointer hover:bg-hover transition-colors">
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
                <span className="text-[11px] text-muted w-full">JPG, GIF or PNG. Max size of 800K</span>
              </div>
            </div>

            <div className={dividerClass} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>First Name</label>
                <input className={fieldClass} value={profile.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Last Name</label>
                <input className={fieldClass} value={profile.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Email Address</label>
              <input className={fieldClass} type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Professional Bio</label>
              <textarea className={textareaClass} rows={4} value={profile.bio} onChange={e => set('bio', e.target.value)} />
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
              <h2 className={sectionTitleClass}>Security &amp; Access</h2>
              <p className={sectionDescriptionClass}>Manage your password, two-factor authentication, and session management.</p>
            </div>
          </div>

          <div className={panelClass}>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Current Password</label>
              <input className={fieldClass} type="password" placeholder="********" value={profile.currentPassword} onChange={e => set('currentPassword', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>New Password</label>
                <input className={fieldClass} type="password" placeholder="********" value={profile.newPassword} onChange={e => set('newPassword', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Confirm Password</label>
                <input className={fieldClass} type="password" placeholder="********" value={profile.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
              </div>
            </div>

            <div className={dividerClass} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <span className={`${itemTitleClass} block mb-0.5`}>Two-Factor Authentication</span>
                <span className={itemDescriptionClass}>Add an extra layer of security to your account.</span>
              </div>
              <ToggleSwitch checked={profile.twoFactor} onChange={v => set('twoFactor', v)} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <span className={`${itemTitleClass} block mb-0.5`}>Session Alerts</span>
                <span className={itemDescriptionClass}>Get notified when a new session is started.</span>
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
              <h2 className={sectionTitleClass}>Notification Channels</h2>
              <p className={sectionDescriptionClass}>Granular control over how and when you want to be notified.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={compactPanelClass}>
              <div className="text-sm font-semibold text-primary">Trading Alerts</div>
              <div className="text-xs text-muted -mt-3">Notifications about your market positions.</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={itemTitleClass}>Price Targets</div>
                  <div className={itemDescriptionClass}>When a coin hits your set price.</div>
                </div>
                <ToggleSwitch checked={notifs.priceTargets} onChange={v => setN('priceTargets', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={itemTitleClass}>Rapid Volatility</div>
                  <div className={itemDescriptionClass}>Significant swings (+/- 5%).</div>
                </div>
                <ToggleSwitch checked={notifs.rapidVolatility} onChange={v => setN('rapidVolatility', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={itemTitleClass}>Liquidations</div>
                  <div className={itemDescriptionClass}>Major market liquidation events.</div>
                </div>
                <ToggleSwitch checked={notifs.liquidations} onChange={v => setN('liquidations', v)} />
              </div>
            </div>

            <div className={compactPanelClass}>
              <div className="text-sm font-semibold text-primary">News &amp; Updates</div>
              <div className="text-xs text-muted -mt-3">Stay informed about the crypto world.</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={itemTitleClass}>Trending Assets</div>
                  <div className={itemDescriptionClass}>Weekly hot assets report.</div>
                </div>
                <ToggleSwitch checked={notifs.trendingAssets} onChange={v => setN('trendingAssets', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={itemTitleClass}>Security Alerts</div>
                  <div className={itemDescriptionClass}>Protocol hacks and risk warnings.</div>
                </div>
                <ToggleSwitch checked={notifs.securityAlerts} onChange={v => setN('securityAlerts', v)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={itemTitleClass}>Product Updates</div>
                  <div className={itemDescriptionClass}>New features and API changes.</div>
                </div>
                <ToggleSwitch checked={notifs.productUpdates} onChange={v => setN('productUpdates', v)} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex flex-col gap-5 rounded-xl border border-red-500/35 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <div className="text-sm font-semibold text-red-500">Deactivate Account</div>
                <div className="text-xs text-muted max-w-[500px]">Permanently delete your account and all associated trading data. This action is irreversible.</div>
              </div>
            </div>
            <button
              className="w-full rounded-lg border-none bg-red-500 px-5 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:flex-shrink-0"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      <div className="flex-shrink-0 flex flex-col gap-3 border-t border-default bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Last saved at {lastSaved}</span>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button className={`${secondaryButtonClass} h-10 cursor-pointer`} onClick={handleDiscard}>Discard Changes</button>
          <button className="h-10 rounded-lg border-none bg-accent px-5 text-sm font-semibold text-white cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <footer className="flex flex-wrap justify-center gap-3 border-t border-subtle py-4 text-center text-xs text-muted sm:gap-5">
        <span>© 2026 Cove. All rights reserved.</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-4 backdrop-blur-sm dark:bg-gray-950/70">
      <div className="w-full max-w-md rounded-xl border border-red-500/35 bg-surface p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-red-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className={sectionTitleClass}>Delete Account</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
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
            className={`${secondaryButtonClass} h-10`}
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className="h-10 cursor-pointer rounded-lg border-none bg-red-500 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
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
