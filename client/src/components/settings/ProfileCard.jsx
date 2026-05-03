export default function ProfileCard({ name, email, onViewProfile }) {
  const displayName = name?.trim() || 'User';
  const displayEmail = email?.trim() || 'No email available';
  const initials = displayName
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="settings-card">
      <div className="profile-card">
        <div className="profile-card-left">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-card-info">
            <span className="profile-name">{displayName}</span>
            <span className="profile-email">{displayEmail}</span>
          </div>
        </div>
        <button className="profile-link-btn" onClick={onViewProfile}>
          View Profile →
        </button>
      </div>
    </div>
  );
}
