// src/components/settings/CurrencySelect.jsx

export default function CurrencySelect({ value, onChange, currencies = [] }) {
  return (
    <div className="currency-select-wrapper">
      <select
        className="currency-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code.toUpperCase()} - {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
