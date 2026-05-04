import { useEffect, useRef, useCallback, useState } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

const DEFAULT_SYMBOLS = {
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

const ALT_SYMBOLS = {
  eur: {
    bitcoin: 'btceur',
    ethereum: 'etheur',
    bnb: 'bnbeur',
    ripple: 'xrpeur',
    cardano: 'adaeur',
    solana: 'soleur',
    dogecoin: 'dogeeur',
    polkadot: 'doteur',
    polygon: 'maticeur',
    litecoin: 'ltceur',
    chainlink: 'linkeur',
    'avalanche-2': 'avaxeur',
    uniswap: 'unieur',
    stellar: 'xlmeur',
    cosmos: 'atomeur',
    'bitcoin-cash': 'bcheur',
    tron: 'trxeur',
  },
  gbp: {
    bitcoin: 'btcgbp',
    ethereum: 'ethgbp',
    bnb: 'bnbgbp',
  },
  try: {
    bitcoin: 'btctry',
    ethereum: 'ethtry',
    bnb: 'bnbtry',
    solana: 'soltry',
    ripple: 'xrptry',
  },
  brl: {
    bitcoin: 'btcbrl',
    ethereum: 'ethbrl',
  },
  aud: {
    bitcoin: 'btcaud',
    ethereum: 'ethaud',
  },
};

function getBinanceSymbol(coinId, currency = 'usd') {
  if (!coinId) return null;
  const id = String(coinId).toLowerCase();
  if (currency !== 'usd' && ALT_SYMBOLS[currency]?.[id]) {
    return `${ALT_SYMBOLS[currency][id]}@trade`;
  }
  return DEFAULT_SYMBOLS[id] ? `${DEFAULT_SYMBOLS[id]}@trade` : null;
}

export function useBinanceWebSocket(coinIds, onPriceUpdate, currency = 'usd') {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onPriceUpdateRef = useRef(onPriceUpdate);

  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  useEffect(() => {
    if (!coinIds || coinIds.length === 0) return;

    const streams = coinIds
      .map(id => getBinanceSymbol(String(id), currency))
      .filter(Boolean);

    if (streams.length === 0) return;

    let ws = new WebSocket(BINANCE_WS_URL);
    let isClosed = false;

    const subscribe = (socket) => {
      socket.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: 1,
      }));
    };

    const handleOpen = () => {
      setIsConnected(true);
      console.log(`Binance WebSocket connected (${currency.toUpperCase()}) -> ${streams.join(', ')}`);
      subscribe(ws);
    };

    const handleMessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.stream && msg.data && msg.data.s && msg.data.p) {
          const symbol = msg.data.s.toLowerCase();
          const price = parseFloat(msg.data.p);
          const all = { ...(ALT_SYMBOLS[currency] || {}), ...DEFAULT_SYMBOLS };
          const coinId = Object.entries(all).find(([, p]) => p === symbol)?.[0];
          if (coinId) onPriceUpdateRef.current(coinId, price);
        }
      } catch (e) {}
    };

    const handleError = () => console.error('Binance WS error');

    const handleClose = () => {
      if (isClosed) return;
      setIsConnected(false);
      console.log(`Binance WS disconnected (${currency.toUpperCase()})`);
      reconnectRef.current = setTimeout(() => {
        const newWs = new WebSocket(BINANCE_WS_URL);
        newWs.onopen = handleOpen;
        newWs.onmessage = handleMessage;
        newWs.onerror = handleError;
        newWs.onclose = handleClose;
        wsRef.current = newWs;
      }, 5000);
    };

    ws.onopen = handleOpen;
    ws.onmessage = handleMessage;
    ws.onerror = handleError;
    ws.onclose = handleClose;
    wsRef.current = ws;

    return () => {
      isClosed = true;
      ws.onclose = null;
      ws.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [coinIds, currency]);

  return { isConnected };
}
