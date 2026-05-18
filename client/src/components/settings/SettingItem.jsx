// src/components/settings/SettingItem.jsx
// CORRECTION : flex row label + control bien alignés

// A single settings row with label, description, and a control element (toggle/select)
export default function SettingItem({ label, description, control }) {
  return (
    <div className="settings-card">
      <div className="setting-item">

        {/* Gauche : label + description */}
        <div className="setting-item-left">
          <span className="setting-label">{label}</span>
          {description && <span className="setting-desc">{description}</span>}
        </div>

        {/* Droite : toggle / select */}
        <div className="setting-item-right">
          {control}
        </div>

      </div>
    </div>
  );
}