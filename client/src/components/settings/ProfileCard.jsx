export default function ProfileCard({ name, email, onViewProfile }) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="settings-card">
      <div className="profile-card">
        <div className="profile-card-left">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-card-info">
            <span className="profile-name">{name}</span>
            <span className="profile-email">{email}</span>
          </div>
        </div>
        <button className="profile-link-btn" onClick={onViewProfile}>
          View Profile →
        </button>
      </div>
    </div>
  );
}