// src/components/settings/SettingsSection.jsx

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