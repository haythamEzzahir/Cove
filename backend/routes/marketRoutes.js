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

// Middleware: validate that coinId only contains safe characters
const validateCoinGeckoId = (req, res, next) => {
  const { coinId } = req.params;
  if (!/^[a-z0-9-]+$/i.test(coinId)) {
    return res.status(400).json({ error: "Invalid coin identifier" });
  }
  next();
};

// GET /public/coins — top 10 coins for landing page ticker
router.get('/public/coins', publicProxyLimiter, getPublicCoins);
// GET /coins — list all coins (Markets table)
router.get('/coins', publicProxyLimiter, getCoins);
// GET /coins/:coinId — get single coin details
router.get('/coins/:coinId', publicProxyLimiter, validateCoinGeckoId, getCoinById);
// GET /chart/:coinId — get historical price chart data
router.get('/chart/:coinId', publicProxyLimiter, validateCoinGeckoId, validateChartQuery, handleValidationErrors, getCoinChart);
// GET /exchange-rates — get fiat exchange rates
router.get('/exchange-rates', publicProxyLimiter, getExchangeRates);
// GET /search — search coins by name/ticker
router.get('/search', publicProxyLimiter, searchCoins);

export default router;
