import { useEffect, useMemo, useRef, useState } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';

function getBinanceStream(ticker, currency = 'usd') {
  if (!ticker) return null;
  const base = ticker.toLowerCase();
  const quote = currency.toLowerCase() === 'usd' ? 'usdt' : currency.toLowerCase();
  return `${base}${quote}@trade`;
}

function buildStreamData(assets, currency) {
  const symbolToId = {};
  const streams = (assets || [])
    .map(asset => {
      const stream = getBinanceStream(asset.ticker, currency);
      if (stream) {
        const binanceSymbol = stream.split('@')[0];
        if (asset.coinId) symbolToId[binanceSymbol] = asset.coinId;
        return stream;
      }
      return null;
    })
    .filter(Boolean);
  return { streams, symbolToId };
}

export function useBinanceWebSocket(assets, onPriceUpdate, currency = 'usd') {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onPriceUpdateRef = useRef(onPriceUpdate);

  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  const streamKey = useMemo(() => {
    const { streams, symbolToId } = buildStreamData(assets, currency);
    if (streams.length === 0 || Object.keys(symbolToId).length === 0) return '';
    return [...new Set(streams)].sort().join(',');
  }, [assets, currency]);

  useEffect(() => {
    if (!streamKey) return;

    const { streams, symbolToId } = buildStreamData(assets, currency);

    const cleanup = () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    cleanup();

    let isClosed = false;

    const handleOpen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: 1,
      }));
    };

    const handleMessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.stream && msg.data && msg.data.s && msg.data.p) {
          const symbol = msg.data.s.toLowerCase();
          const price = parseFloat(msg.data.p);
          const coinId = symbolToId[symbol];
          if (coinId) {
            onPriceUpdateRef.current(coinId, price);
          }
        }
      } catch (e) {
        // Silently ignore malformed messages or subscription confirmations
      }
    };

    const handleClose = () => {
      if (isClosed) return;
      setIsConnected(false);

      reconnectRef.current = setTimeout(() => {
        const ws = new WebSocket(BINANCE_WS_URL);
        ws.onopen = handleOpen;
        ws.onmessage = handleMessage;
        ws.onerror = () => {};
        ws.onclose = handleClose;
        wsRef.current = ws;
      }, 5000);
    };

    const ws = new WebSocket(BINANCE_WS_URL);
    ws.onopen = handleOpen;
    ws.onmessage = handleMessage;
    ws.onerror = () => {};
    ws.onclose = handleClose;
    wsRef.current = ws;

    return () => {
      isClosed = true;
      cleanup();
    };
  }, [streamKey]);

  return { isConnected };
}
