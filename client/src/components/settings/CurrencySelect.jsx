// src/components/settings/CurrencySelect.jsx

const CURRENCIES = [
  { value: 'USD', label: '🇺🇸 USD – US Dollar' },
  { value: 'EUR', label: '🇪🇺 EUR – Euro' },
  { value: 'GBP', label: '🇬🇧 GBP – British Pound' },
  { value: 'MAD', label: '🇲🇦 MAD – Dirham marocain' },
  { value: 'BTC', label: '₿  BTC – Bitcoin' },
  { value: 'ETH', label: 'Ξ  ETH – Ethereum' },
];

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