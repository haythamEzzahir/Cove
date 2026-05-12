import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useBinanceWebSocket } from './useBinanceWebSocket';
import { fetchWithAuth } from '../config';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/coins` : 'http://localhost:5000/coins';
const CHART_API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/chart` : 'http://localhost:5000/chart';

const TIME_PERIOD_MAP = {
  '1D': '1',
  '7D': '7',
  '1M': '30',
  '1Y': '365',
  'All': 'max',
};

const MAX_POINTS = {
  '1': 48,
  '7': 56,
  '30': 60,
  '365': 72,
  'max': 80,
};

export function useMarketData() {
  const { currency, currencyData } = useCurrency();
  const [data, setData] = useState({
    metrics: [],
    chartData: [],
    chartPeriod: '7D',
    featuredCoin: null,
    trendingCoins: [],
    assets: [],
    loading: true,
    error: null,
  });

  const formatPrice = useCallback((price) => {
    if (!price && price !== 0) return '-';
    if (price >= 1) return `${currencyData.symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currencyData.symbol}${price.toFixed(6)}`;
  }, [currencyData.symbol]);

  const formatMarketCap = useCallback((cap) => {
    if (!cap && cap !== 0) return '-';
    if (cap >= 1e12) return `${currencyData.symbol}${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `${currencyData.symbol}${(cap / 1e9).toFixed(1)}B`;
    return `${currencyData.symbol}${(cap / 1e6).toFixed(1)}M`;
  }, [currencyData.symbol]);

  const handlePriceUpdate = useCallback((coinId, newPrice) => {
    setData(prev => {
      const updatedAssets = prev.assets.map(asset => {
        if (asset.coinId.toLowerCase() === coinId.toLowerCase()) {
          const priceDirection = newPrice > asset.current_price ? 'up' : newPrice < asset.current_price ? 'down' : asset.priceDirection;
          return {
            ...asset,
            price: formatPrice(newPrice),
            current_price: newPrice,
            priceDirection,
          };
        }
        return asset;
      });

      let updatedFeatured = prev.featuredCoin;
      if (prev.featuredCoin?.coinId.toLowerCase() === coinId.toLowerCase()) {
        const priceDirection = newPrice > prev.featuredCoin.price ? 'up' : newPrice < prev.featuredCoin.price ? 'down' : prev.featuredCoin.priceDirection;
        updatedFeatured = {
          ...prev.featuredCoin,
          price: newPrice,
          priceDirection,
        };
      }

      const updatedTrending = prev.trendingCoins.map(coin => {
        if (coin.coinId.toLowerCase() === coinId.toLowerCase()) {
          const priceDirection = newPrice > coin.current_price ? 'up' : newPrice < coin.current_price ? 'down' : coin.priceDirection;
          return {
            ...coin,
            price: formatPrice(newPrice),
            current_price: newPrice,
            priceDirection,
          };
        }
        return coin;
      });

      return {
        ...prev,
        assets: updatedAssets,
        featuredCoin: updatedFeatured,
        trendingCoins: updatedTrending,
      };
    });
  }, [formatPrice]);

  useBinanceWebSocket(data.assets, handlePriceUpdate, currency);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const res = await fetchWithAuth(`${API_URL}?currency=${currency}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const coins = await res.json();
        
        if (coins && coins.length > 0) {
          const totalMarketCap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
          const totalVolume = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);
          const btcDominance = coins[0]?.market_cap_share ? (coins[0].market_cap / totalMarketCap * 100) : 50;

          const featured = coins[0];
          const trending = coins.slice(0, 4).map(c => ({
            name: c.name,
            ticker: c.symbol.toUpperCase(),
            price: formatPrice(c.current_price),
            change: c.price_change_percentage_24h,
            image: c.image,
            coinId: c.id,
            current_price: c.current_price,
          }));

          const assets = coins.map((c, i) => ({
            rank: i + 1,
            name: c.name,
            ticker: c.symbol.toUpperCase(),
            price: formatPrice(c.current_price),
            current_price: c.current_price,
            change: c.price_change_percentage_24h || 0,
            price_change_percentage_24h: c.price_change_percentage_24h || 0,
            price_change_percentage_1h_in_currency: c.price_change_percentage_1h_in_currency || 0,
            price_change_percentage_7d_in_currency: c.price_change_percentage_7d_in_currency || 0,
            marketCap: formatMarketCap(c.market_cap || 0),
            market_cap: c.market_cap || 0,
            volume: formatMarketCap(c.total_volume || 0),
            total_volume: c.total_volume || 0,
            image: c.image,
            coinId: c.id,
            high24h: c.high_24h ? formatPrice(c.high_24h) : null,
            low24h: c.low_24h ? formatPrice(c.low_24h) : null,
            ath: c.ath ? formatPrice(c.ath) : null,
            ath_change: c.ath_change_percentage || 0,
            atl: c.atl ? formatPrice(c.atl) : null,
            marketCapRank: c.market_cap_rank,
            market_cap_rank: c.market_cap_rank,
            fullyDilutedValuation: c.fully_diluted_valuation ? formatMarketCap(c.fully_diluted_valuation) : null,
          }));

          const metrics = [
            {
              id: 'marketCap',
              label: 'Market Cap',
              value: formatMarketCap(totalMarketCap),
              change: 2.4,
            },
            {
              id: 'volume',
              label: '24h Volume',
              value: formatMarketCap(totalVolume),
              change: -1.2,
            },
            {
              id: 'dominance',
              label: 'BTC Dominance',
              value: `${btcDominance.toFixed(1)}%`,
              change: 0.3,
            },
            {
              id: 'fearGreed',
              label: 'Fear & Greed',
              value: '72/100',
              change: null,
              badge: 'Greed',
            },
            {
              id: 'ath',
              label: 'BTC ATH',
              value: '$69,044',
              change: 0,
            },
            {
              id: 'globalCap',
              label: 'Global Cap',
              value: formatMarketCap(totalMarketCap * 1.3),
              change: 1.8,
            },
          ];

          setData(prev => ({
            ...prev,
            metrics,
            featuredCoin: {
              name: featured.name,
              ticker: featured.symbol.toUpperCase(),
              coinId: featured.id,
              status: 'Market Open',
              price: featured.current_price,
              change: featured.price_change_percentage_24h || 0,
              changeAbs: featured.current_price * ((featured.price_change_percentage_24h || 0) / 100),
              image: featured.image,
            },
            trendingCoins: trending,
            assets,
            loading: false,
            error: null,
          }));
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        setData(prev => ({ ...prev, loading: false, error: error.message }));
      }
    };

    fetchData();
  }, [currency, currencyData.symbol]);

  const fetchChartData = async (period = '7D', coinId = data.featuredCoin?.coinId) => {
    if (!coinId) return;
    
    try {
      const days = TIME_PERIOD_MAP[period] || '7';
      const maxPoints = MAX_POINTS[days] || 60;
        const res = await fetchWithAuth(`${CHART_API_URL}/${coinId}?currency=${currency}&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      
      const chartData = await res.json();
      
      const useHours = days === '1';
      const useMonths = days === '30' || days === '365' || days === 'max';
      
      const allPrices = chartData.prices || [];
      const step = Math.max(1, Math.floor(allPrices.length / maxPoints));
      const sampledPrices = allPrices.filter((_, i) => i % step === 0);
      
      const formattedData = sampledPrices.map((item) => {
        const timestamp = item[0];
        const price = item[1];
        const date = new Date(timestamp);
        let label;
        
        if (useHours) {
          label = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
        } else if (useMonths) {
          label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        } else {
          label = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        }
        return { t: label, price };
      });
      
      setData(prev => ({
        ...prev,
        chartData: formattedData,
        chartPeriod: period,
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const selectCoin = (coin) => {
    if (!coin) return;
    
    setData(prev => ({
      ...prev,
      featuredCoin: {
        name: coin.name,
        ticker: coin.ticker,
        coinId: coin.coinId,
        status: 'Market Open',
        price: coin.current_price,
        change: coin.change,
        changeAbs: coin.current_price * (coin.change / 100),
        image: coin.image,
      },
      chartData: [],
    }));
    
    fetchChartData('7D', coin.coinId);
  };

  return { ...data, fetchChartData, selectCoin };
}
