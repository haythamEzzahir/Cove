import { useEffect, useRef, useCallback } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

const COINGECKO_TO_BINANCE = {
  bitcoin: 'btcusdt',
  ethereum: 'ethusdt',
  tether: 'usdtusdt',
  bnb: 'bnbusdt',
  solana: 'solusdt',
  'usd-coin': 'usdcusdt',
  ripple: 'xrpusdt',
  dogecoin: 'dogeusdt',
  cardano: 'adausdt',
  'avalanche-2': 'avaxusdt',
  'shiba-inu': 'shibusdt',
  polkadot: 'dotusdt',
  tron: 'trxusdt',
  chainlink: 'linkusdt',
  polygon: 'maticusdt',
  'wrapped-bitcoin': 'wbtcusdt',
  litecoin: 'ltcusdt',
  'bitcoin-cash': 'bchusdt',
  uniswap: 'uniusdt',
  stellar: 'xlmusdt',
  cosmos: 'atomusdt',
  monero: 'xmrusdt',
  'ethereum-classic': 'etcusdt',
  'hedera-hashgraph': 'hbarusdt',
  filecoin: 'filusdt',
  'internet-computer': 'icpusdt',
  'aptcoin': 'aptusdt',
  arbitrum: 'arbusdt',
  chainlist: 'clvusdt',
  near: 'nearusdt',
  vesta: 'eusdt',
};

function getBinanceSymbol(coinId) {
  const symbol = COINGECKO_TO_BINANCE[coinId.toLowerCase()];
  return symbol ? `${symbol}@trade` : null;
}

function buildStream(coins) {
  const streams = coins
    .map(c => getBinanceSymbol(c.coinId))
    .filter(Boolean);
  return streams.join('/');
}

export function useBinanceWebSocket(coins, onPriceUpdate) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (!coins || coins.length === 0) return;
    
    const stream = buildStream(coins);
    if (!stream) return;

    const ws = new WebSocket(`${BINANCE_WS_URL}/${stream}`);

    ws.onopen = () => {
      console.log('Binance WebSocket connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.s && data.p) {
          const symbol = data.s.toLowerCase();
          const price = parseFloat(data.p);
          
          const coinId = Object.entries(COINGECKO_TO_BINANCE)
            .find(([, binancePair]) => binancePair.toLowerCase() === symbol)?.[0];

          if (coinId && onPriceUpdate) {
            onPriceUpdate(coinId, price);
          }
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Binance WebSocket disconnected');
      wsRef.current = null;

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [coins, onPriceUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}