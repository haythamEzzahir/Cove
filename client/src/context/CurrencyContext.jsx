import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSettings } from './SettingsContext';

const CurrencyContext = createContext(null);

const CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'US Dollar' },
  { code: 'eur', symbol: '\u20ac', name: 'Euro' },
  { code: 'gbp', symbol: '\u00a3', name: 'British Pound' },
  { code: 'jpy', symbol: '\u00a5', name: 'Japanese Yen' },
  { code: 'aed', symbol: '\u062f.\u0625', name: 'UAE Dirham' },
  { code: 'sar', symbol: '\ufdfc', name: 'Saudi Riyal' },
  { code: 'egp', symbol: 'E\u00a3', name: 'Egyptian Pound' },
];

function normalizeCurrency(value) {
  const code = String(value || '').trim().toLowerCase();
  return CURRENCIES.some((currency) => currency.code === code) ? code : 'usd';
}

export function CurrencyProvider({ children }) {
  const { settings, updateSetting } = useSettings();
  const currency = normalizeCurrency(settings.currency);

  const setCurrency = useCallback((value) => {
    return updateSetting('currency', normalizeCurrency(value));
  }, [updateSetting]);

  const currencyData = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0],
    [currency]
  );

  const value = useMemo(() => ({
    currency,
    setCurrency,
    updateCurrency: setCurrency,
    currencies: CURRENCIES,
    currencyData,
  }), [currency, currencyData, setCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
