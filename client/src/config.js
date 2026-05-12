export const API_URL = import.meta.env.VITE_API_URL || '';

export const AUTH_REDIRECT_KEY = 'fintracker_auth_redirect';

export function getSafeRedirectPath(path) {
  if (!path || typeof path !== 'string') return '/';
  try {
    const url = new URL(path, 'http://localhost');
    if (url.origin !== 'http://localhost') return '/';
  } catch {
    return '/';
  }
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}

export async function getJson(response) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return {};
  } catch {
    return {};
  }
}

export function formatPrice(value, symbol = '$') {
  if (value == null || Number.isNaN(value)) return `${symbol}0.00`;
  const num = Number(value);
  if (num >= 1) return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 0.01) return `${symbol}${num.toFixed(4)}`;
  return `${symbol}${num.toFixed(8)}`;
}

export function formatMarketCap(value) {
  if (value == null || Number.isNaN(value)) return '$0';
  const num = Number(value);
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export async function fetchWithAuth(url, options = {}) {
  const { headers = {}, ...rest } = options;

  const doFetch = (token) => fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  let response = await doFetch();

  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      response = await doFetch();
    }
  }

  return response;
}
