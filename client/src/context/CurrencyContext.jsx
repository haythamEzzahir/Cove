import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'fintracker_currency';

const CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '€', name: 'Euro' },
  { code: 'gbp', symbol: '£', name: 'British Pound' },
  { code: 'jpy', symbol: '¥', name: 'Japanese Yen' },
  { code: 'aed', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'sar', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'egp', symbol: 'E£', name: 'Egyptian Pound' },
];

function normalizeCurrency(value) {
  const code = String(value || '').trim().toLowerCase();
  return CURRENCIES.some((currency) => currency.code === code) ? code : 'usd';
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      return normalizeCurrency(localStorage.getItem(STORAGE_KEY));
    } catch {
      return 'usd';
    }
  });

  const setCurrency = useCallback((value) => {
    setCurrencyState(normalizeCurrency(value));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // ignore localStorage errors
    }
  }, [currency]);

  const currencyData = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, updateCurrency: setCurrency, currencies: CURRENCIES, currencyData }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
