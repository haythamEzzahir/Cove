import { useState, useEffect } from 'react';
import { metrics, chartData, featuredCoin, trendingCoins, assets } from '../data/mockData';

/**
 * useMarketData
 * Centralizes all market data fetching.
 * Currently returns mock data — replace fetch logic with a real API
 * (e.g. CoinGecko, Binance WS) without touching any component.
 */
export function useMarketData() {
  const [data, setData] = useState({
    metrics,
    chartData,
    featuredCoin,
    trendingCoins,
    assets,
    loading: false,
    error: null,
  });

  useEffect(() => {
    // TODO: replace with real API call
    // Example:
    // const res = await fetch('https://api.coingecko.com/api/v3/...');
    // const json = await res.json();
    // setData({ ...transform(json), loading: false });
  }, []);

  return data;
}