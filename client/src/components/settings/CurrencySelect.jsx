const CURRENCIES = [
  { value: 'usd', label: '🇺🇸 USD – US Dollar' },
  { value: 'eur', label: '🇪🇺 EUR – Euro' },
  { value: 'gbp', label: '🇬🇧 GBP – British Pound' },
  { value: 'jpy', label: '🇯🇵 JPY – Japanese Yen' },
  { value: 'aed', label: '🇦🇪 AED – UAE Dirham' },
  { value: 'sar', label: '🇸🇦 SAR – Saudi Riyal' },
  { value: 'egp', label: '🇪🇬 EGP – Egyptian Pound' },
];

// Dropdown select for choosing the display currency
export default function CurrencySelect({ value, onChange }) {
  return (
    <div className="currency-select-wrapper">
      <select
        className="currency-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}