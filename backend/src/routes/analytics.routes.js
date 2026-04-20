import { Router } from 'express';
import {
  getOverview,
  getReturnRate,
  getReturnsByMonth,
  getReturnsByProduct,
  getSalesByCategory,
  getSalesByCountry,
  getSalesByMonth,
  getSalesByYear,
  getTopProducts,
  getSalesDetail
} from '../controllers/analytics.controller.js';
import {
  validateLimitQuery,
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
router.get('/returns-by-product', validateLimitQuery, getReturnsByProduct);
router.get('/returns-by-month', validateSalesByMonthQuery, getReturnsByMonth);
router.get('/return-rate', validateLimitQuery, getReturnRate);
router.get('/sales-detail', validateSalesDetailQuery, getSalesDetail);

export default router;
