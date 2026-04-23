import { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = 'http://localhost:5000/coins';
const CHART_API_URL = 'http://localhost:5000/chart';

const TIME_PERIOD_MAP = {
  '1D': '1',
  '7D': '7',
  '1M': '30',
  '1Y': '365',
  'All': 'max',
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const res = await fetch(`${API_URL}?currency=${currency}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const coins = await res.json();
        
        if (coins && coins.length > 0) {
          const formatPrice = (price) => {
            if (price >= 1) return `${currencyData.symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return `${currencyData.symbol}${price.toFixed(6)}`;
          };

          const formatMarketCap = (cap) => {
            if (cap >= 1e12) return `${currencyData.symbol}${(cap / 1e12).toFixed(2)}T`;
            if (cap >= 1e9) return `${currencyData.symbol}${(cap / 1e9).toFixed(1)}B`;
            return `${currencyData.symbol}${(cap / 1e6).toFixed(1)}M`;
          };

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
            change: c.price_change_percentage_24h || 0,
            marketCap: formatMarketCap(c.market_cap || 0),
            volume: formatMarketCap(c.total_volume || 0),
            image: c.image,
            coinId: c.id,
          }));

          const metrics = [
            {
              id: 'marketCap',
              label: 'Market Cap',
              value: formatMarketCap(totalMarketCap),
              change: null,
            },
            {
              id: 'volume',
              label: '24h Volume',
              value: formatMarketCap(totalVolume),
              change: null,
            },
            {
              id: 'dominance',
              label: 'BTC Dominance',
              value: `${btcDominance.toFixed(1)}%`,
              change: null,
            },
            {
              id: 'fearGreed',
              label: 'Fear & Greed',
              value: '72/100',
              change: null,
              badge: 'Greed',
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
      const res = await fetch(`${CHART_API_URL}/${coinId}?currency=${currency}&days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      
      const chartData = await res.json();
      
      const formattedData = (chartData.prices || []).map(([timestamp, price]) => ({
        t: new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        price,
      }));
      
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