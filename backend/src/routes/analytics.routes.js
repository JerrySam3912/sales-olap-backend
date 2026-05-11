import { Router } from 'express';
import {
  getCountryStats,
  getExecutiveKPIs,
  getOrdersByIncomeLevel,
  getOrdersByOccupation,
  getOverview,
  getRevenueTrending,
  getReturnRate,
  getReturnsByProduct,
  getSalesByCategory,
  getSalesByCountry,
  getSalesByMonth,
  getSalesByYear,
  getTopProducts,
  getSalesDetail
} from '../controllers/analytics.controller.js';
import {
  validateCountryStatsQuery,
  validateExecutiveKPIsQuery,
  validateLimitQuery,
  validateRevenueTrendingQuery,
  validateSalesByCategoryQuery,
  validateSalesByMonthQuery,
  validateSalesDetailQuery
} from '../middlewares/validation.middleware.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/sales-by-year', getSalesByYear);
router.get('/sales-by-month', validateSalesByMonthQuery, getSalesByMonth);
router.get('/top-products', validateLimitQuery, getTopProducts);
router.get('/sales-by-country', getSalesByCountry);
router.get('/sales-by-category', validateSalesByCategoryQuery, getSalesByCategory);
router.get('/executive-kpis', validateExecutiveKPIsQuery, getExecutiveKPIs);
router.get('/revenue-trending', validateRevenueTrendingQuery, getRevenueTrending);
router.get('/country-stats', validateCountryStatsQuery, getCountryStats);
router.get('/returns-by-product', validateLimitQuery, getReturnsByProduct);
router.get('/return-rate', validateLimitQuery, getReturnRate);
router.get('/sales-detail', validateSalesDetailQuery, getSalesDetail);
router.get('/orders-by-income-level', getOrdersByIncomeLevel);
router.get('/orders-by-occupation', getOrdersByOccupation);

export default router;
