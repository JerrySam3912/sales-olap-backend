import { Router } from 'express';
import {
  getCountryStats,
  getCustomerKPIs,
  getExecutiveKPIs,
  getOverview,
  getOrdersByGender,
  getOrdersByIncomeLevel,
  getOrdersByOccupation,
  getProfitTrending,
  getRevenueTrending,
  getReturnRate,
  getReturnsByProduct,
  getSalesByCategory,
  getSalesByCountry,
  getSalesByMonth,
  getSalesByYear,
  getTopProductsByOrders,
  getTopProducts,
  getSalesDetail
} from '../controllers/analytics.controller.js';
import {
  validateCountryStatsQuery,
  validateExecutiveKPIsQuery,
  validateLimitQuery,
  validateProfitTrendingQuery,
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
router.get('/customer-kpis', getCustomerKPIs);
router.get('/orders-by-gender', getOrdersByGender);
router.get('/orders-by-occupation', getOrdersByOccupation);
router.get('/orders-by-income-level', getOrdersByIncomeLevel);
router.get('/top-products-by-orders', validateLimitQuery, getTopProductsByOrders);
router.get('/profit-trending', validateProfitTrendingQuery, getProfitTrending);

export default router;
