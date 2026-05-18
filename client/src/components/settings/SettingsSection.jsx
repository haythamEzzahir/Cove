// src/components/settings/SettingsSection.jsx

// A grouped settings section with a title header and card-style content
export default function SettingsSection({ title, children }) {
  return (
    <div className="settings-section">
      <p className="settings-section-label">{title}</p>
      <div className="settings-section-content">
        {children}
      </div>
    </div>
  );
}