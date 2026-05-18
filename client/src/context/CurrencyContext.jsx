import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext(null);

const CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'aed', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'sar', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'egp', symbol: 'E£', name: 'Egyptian Pound' },
];

// Provides the selected currency (USD, EUR, etc.) and persists it to localStorage
export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem('fintracker_currency');
      return saved || 'usd';
    } catch {
      return 'usd';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fintracker_currency', currency);
    } catch {}
  }, [currency]);

  const currencyData = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies: CURRENCIES, currencyData }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to access the current currency and available options
export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}