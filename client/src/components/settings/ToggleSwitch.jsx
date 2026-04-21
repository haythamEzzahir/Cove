// src/components/settings/ToggleSwitch.jsx
// <button> avec .toggle-switch + .active conditionnel
// Le .toggle-thumb est positionné par CSS — aucune logique JS

export default function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle-switch${checked ? ' active' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}