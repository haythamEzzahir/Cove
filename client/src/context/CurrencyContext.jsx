import { createContext, useContext } from 'react';
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

function getCurrency(code) {
  return CURRENCIES.find((currency) => currency.code === code) || CURRENCIES[0];
}

export function CurrencyProvider({ children }) {
  const { settings, updateSetting } = useSettings();

  // Currency is stored in SettingsContext. This context only makes it easier to use.
  const currency = settings.currency || 'usd';
  const currencyData = getCurrency(currency);

  function setCurrency(value) {
    const nextCurrency = getCurrency(value).code;
    return updateSetting('currency', nextCurrency);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyData,
        currencies: CURRENCIES,
        setCurrency,
        updateCurrency: setCurrency,
      }}
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
