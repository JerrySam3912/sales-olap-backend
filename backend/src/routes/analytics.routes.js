import { Router } from 'express';
import {
  getOverview,
  getReturnRate,
  getReturnsByProduct,
  getSalesByCategory,
  getSalesByCountry,
  getSalesByMonth,
  getSalesByYear,
  getTopProducts,
  getSalesDetail,
  getExecutiveKPIs,
  getRevenueTrending,
  getCountryStats,
  getCustomerKPIs,
  getOrdersByIncomeLevel,
  getTopProductsByOrders,
  getProfitTrending
} from '../controllers/analytics.controller.js';
import {
  validateLimitQuery,
  validateSalesByCategoryQuery,
  validateSalesByMonthQuery,
  validateSalesDetailQuery,
  validateTimeFilterQuery,
  validateRevenueTrendingQuery,
  validateProductKeyQuery
} from '../middlewares/validation.middleware.js';

const router = Router();

// ─── Existing routes ──────────────────────────────────────────────────────────
router.get('/overview',          getOverview);
router.get('/sales-by-year',     getSalesByYear);
router.get('/sales-by-month',    validateSalesByMonthQuery,   getSalesByMonth);
router.get('/top-products',      validateLimitQuery,          getTopProducts);
router.get('/sales-by-country',  getSalesByCountry);
router.get('/sales-by-category', validateSalesByCategoryQuery, getSalesByCategory);
router.get('/returns-by-product',validateLimitQuery,          getReturnsByProduct);
router.get('/return-rate',       validateLimitQuery,          getReturnRate);
router.get('/sales-detail',      validateSalesDetailQuery,    getSalesDetail);

// ─── Page 1: Executive ────────────────────────────────────────────────────────
// GET /analytics/executive-kpis?year=&month=&date=
router.get('/executive-kpis',    validateTimeFilterQuery,     getExecutiveKPIs);

// GET /analytics/revenue-trending?layer=year|month|day&year=&month=
router.get('/revenue-trending',  validateRevenueTrendingQuery, getRevenueTrending);

// GET /analytics/country-stats?year=&month=&date=&limit=
router.get('/country-stats',     validateTimeFilterQuery,     getCountryStats);

// ─── Page 2: Customer & Product ───────────────────────────────────────────────
// GET /analytics/customer-kpis
router.get('/customer-kpis',     getCustomerKPIs);

// GET /analytics/orders-by-income
router.get('/orders-by-income',  getOrdersByIncomeLevel);

// GET /analytics/top-products-by-orders?limit=
router.get('/top-products-by-orders', validateLimitQuery,    getTopProductsByOrders);

// GET /analytics/profit-trending?product_key=
router.get('/profit-trending',   validateProductKeyQuery,    getProfitTrending);

export default router;
