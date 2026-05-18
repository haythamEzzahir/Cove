import { getCache, setCache } from "../utils/cache.js";

// Fetch data from CoinGecko API with API key header
const fetchCoinGecko = async (url) => {
  return fetch(url, {
    method: "GET",
    headers: {
      "x-cg-demo-api-key": process.env.CG_API_KEY,
    },
  });
};

// Get top 10 coins for the landing page ticker (cached)
export const getPublicCoins = async (req, res) => {
  const cacheKey = "coins_list_public";
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const currency = req.query.currency || "usd";
    const response = await fetchCoinGecko(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=1`
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch market data" });
    }

    const data = await response.json();
    await setCache(cacheKey, data, 60);
    res.json(data);
  } catch (error) {
    console.error("Fetch public coins error:", error.message);
    res.status(502).json({ error: "Failed to fetch coins" });
  }
};

// Get up to 100 coins for Markets table, optionally filtered by IDs (cached)
export const getCoins = async (req, res) => {
  const ids = req.query.ids;
  const currency = req.query.currency || "usd";
  const cacheKey = ids ? `coins_list_${ids}_${currency}` : `coins_list_${currency}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const idsParam = ids ? `&ids=${encodeURIComponent(ids)}` : "";
    const response = await fetchCoinGecko(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}${idsParam}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h%2C7d`
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch market data" });
    }

    const data = await response.json();
    await setCache(cacheKey, data, ids ? 30 : 60);
    res.json(data);
  } catch (error) {
    console.error("Fetch coins error:", error.message);
    res.status(502).json({ error: "Failed to fetch coins" });
  }
};

// Get detailed data for a single coin by its CoinGecko ID (cached)
export const getCoinById = async (req, res) => {
  const { coinId } = req.params;
  const currency = req.query.currency || "usd";
  const cacheKey = `coin_${coinId}_${currency}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetchCoinGecko(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    );

    if (!response.ok) {
      const status = response.status === 404 ? 404 : response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch coin data" });
    }

    const data = await response.json();
    const marketData = data.market_data || {};

    const priceChange24h = marketData.price_change_percentage_24h;
    const normalizedChange24h = typeof priceChange24h === 'object' ? priceChange24h?.[currency] ?? null : priceChange24h;

    const result = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.small || "",
      current_price: marketData.current_price?.[currency] ?? null,
      market_cap: marketData.market_cap?.[currency] ?? null,
      total_volume: marketData.total_volume?.[currency] ?? null,
      high_24h: marketData.high_24h?.[currency] ?? null,
      low_24h: marketData.low_24h?.[currency] ?? null,
      price_change_percentage_24h: normalizedChange24h ?? null,
      price_change_percentage_1h_in_currency: typeof marketData.price_change_percentage_1h_in_currency === 'object' ? marketData.price_change_percentage_1h_in_currency?.[currency] ?? null : marketData.price_change_percentage_1h_in_currency ?? null,
      price_change_percentage_7d_in_currency: typeof marketData.price_change_percentage_7d_in_currency === 'object' ? marketData.price_change_percentage_7d_in_currency?.[currency] ?? null : marketData.price_change_percentage_7d_in_currency ?? null,
      ath: marketData.ath?.[currency] ?? null,
      ath_change_percentage: marketData.ath_change_percentage?.[currency] ?? null,
      atl: marketData.atl?.[currency] ?? null,
      sparkline_in_7d: marketData.sparkline_7d,
      market_cap_rank: data.market_cap_rank,
    };

    await setCache(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    console.error("Get single coin error:", error.message);
    res.status(502).json({ error: "Failed to fetch coin" });
  }
};

// Get historical price chart data for a coin (cached 5 min)
export const getCoinChart = async (req, res) => {
  const { coinId } = req.params;
  const currency = req.query.currency || "usd";
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 7));
  const cacheKey = `chart_${coinId}_${days}_${currency}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetchCoinGecko(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
    );

    if (!response.ok) {
      const status = response.status === 404 ? 404 : response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch chart data" });
    }

    const data = await response.json();
    await setCache(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    console.error("Chart data error:", error.message);
    res.status(502).json({ error: "Failed to fetch chart data" });
  }
};

// Get fiat exchange rates from CoinGecko (cached 1 hour)
export const getExchangeRates = async (req, res) => {
  const cacheKey = "exchange_rates";
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetchCoinGecko(
      `https://api.coingecko.com/api/v3/exchange_rates`
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch exchange rates" });
    }

    const data = await response.json();
    await setCache(cacheKey, data.rates, 3600);
    res.json(data.rates);
  } catch (error) {
    console.error("Exchange rates error:", error.message);
    res.status(502).json({ error: "Failed to fetch exchange rates" });
  }
};

// Search coins by name or ticker via CoinGecko (cached 2 min)
export const searchCoins = async (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();
  const cacheKey = `search_${query}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    if (query.length > 100) {
      return res.status(400).json({ error: "Search query too long" });
    }
    const response = await fetchCoinGecko(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to search coins" });
    }

    const data = await response.json();
    await setCache(cacheKey, data, 120);
    res.json(data);
  } catch (error) {
    console.error("Search coins error:", error.message);
    res.status(502).json({ error: "Failed to search coins" });
  }
};
