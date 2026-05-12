import express from 'express';
import {
  getPublicCoins,
  getCoins,
  getCoinById,
  getCoinChart,
  getExchangeRates,
  searchCoins
} from '../controllers/marketController.js';
import { publicProxyLimiter } from '../middleware/rateLimiter.js';
import { validateCoinIdParam, validateChartQuery, handleValidationErrors } from '../utils/validators.js';

const router = express.Router();

const validateCoinGeckoId = (req, res, next) => {
  const { coinId } = req.params;
  if (!/^[a-z0-9-]+$/i.test(coinId)) {
    return res.status(400).json({ error: "Invalid coin identifier" });
  }
  next();
};

router.get('/public/coins', publicProxyLimiter, getPublicCoins);
router.get('/coins', publicProxyLimiter, getCoins);
router.get('/coins/:coinId', publicProxyLimiter, validateCoinGeckoId, getCoinById);
router.get('/chart/:coinId', publicProxyLimiter, validateCoinGeckoId, validateChartQuery, handleValidationErrors, getCoinChart);
router.get('/exchange-rates', publicProxyLimiter, getExchangeRates);
router.get('/search', publicProxyLimiter, searchCoins);

export default router;
