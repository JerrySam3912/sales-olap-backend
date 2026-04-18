import {
  getOverviewQuery,
  getReturnRateQuery,
  getReturnsByProductQuery,
  getSalesByCategoryQuery,
  getSalesByCountryQuery,
  getSalesByMonthQuery,
  getSalesByYearQuery,
  getSalesDetailCountQuery,
  getSalesDetailQuery,
  getTopProductsQuery,
  getExecutiveSalesKPIsQuery,
  getExecutiveReturnQuantityQuery,
  getRevenueTrendingQuery,
  getCountryStatsQuery,
  getCustomerKPIsQuery,
  getOrdersByIncomeLevelQuery,
  getTopProductsByOrdersQuery,
  getProfitTrendingQuery
} from '../queries/analytics.query.js';
import { buildPaginatedResponse, getPagination } from '../utils/response.js';

const parseLimit = (limit, fallback = 10) => {
  const parsed = Number.parseInt(limit, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

// ─── Existing services ────────────────────────────────────────────────────────

export const getOverview = async () => {
  return getOverviewQuery();
};

export const getSalesByYear = async () => {
  return getSalesByYearQuery();
};

export const getSalesByMonth = async (year) => {
  return getSalesByMonthQuery(year);
};

export const getTopProducts = async (limit) => {
  const safeLimit = parseLimit(limit, 10);
  return getTopProductsQuery(safeLimit);
};

export const getSalesByCountry = async () => {
  return getSalesByCountryQuery();
};

export const getSalesByCategory = async ({ year, month, date, country }) => {
  return getSalesByCategoryQuery(year, month, date, country);
};

export const getReturnsByProduct = async (limit) => {
  const safeLimit = parseLimit(limit, 10);
  return getReturnsByProductQuery(safeLimit);
};

export const getReturnRate = async (limit) => {
  const safeLimit = parseLimit(limit, 10);
  return getReturnRateQuery(safeLimit);
};

export const getSalesDetail = async ({ year, country, category, page, limit }) => {
  const pagination = getPagination(page, limit);
  const filters = { year, country, category };

  const [rows, totalResult] = await Promise.all([
    getSalesDetailQuery({ ...filters, limit: pagination.limit, offset: pagination.offset }),
    getSalesDetailCountQuery(filters)
  ]);

  return buildPaginatedResponse({
    rows,
    total: totalResult.total_records,
    page: pagination.page,
    limit: pagination.limit
  });
};

// ─── Page 1: Executive KPIs ───────────────────────────────────────────────────

export const getExecutiveKPIs = async ({ year, month, date }) => {
  const [salesData, returnData] = await Promise.all([
    getExecutiveSalesKPIsQuery({ year, month, date }),
    getExecutiveReturnQuantityQuery({ year, month, date })
  ]);

  const totalQuantitySold = Number(salesData.total_quantity_sold) || 0;
  const totalReturnQuantity = Number(returnData.total_return_quantity) || 0;
  const returnRate = totalQuantitySold > 0
    ? Math.round((totalReturnQuantity / totalQuantitySold) * 10000) / 100
    : 0;

  return {
    total_revenue: salesData.total_revenue,
    total_profit: salesData.total_profit,
    total_orders: salesData.total_orders,
    total_return_rate: returnRate
  };
};

// ─── Page 1: Revenue Trending ─────────────────────────────────────────────────

export const getRevenueTrending = async ({ layer, year, month }) => {
  return getRevenueTrendingQuery({ layer, year, month });
};

// ─── Page 1: Country Stats ────────────────────────────────────────────────────

export const getCountryStats = async ({ year, month, date, limit }) => {
  const safeLimit = parseLimit(limit, 5);
  return getCountryStatsQuery({ year, month, date, limit: safeLimit });
};

// ─── Page 2: Customer KPIs ────────────────────────────────────────────────────

export const getCustomerKPIs = async () => {
  return getCustomerKPIsQuery();
};

// ─── Page 2: Orders by Income Level ──────────────────────────────────────────

export const getOrdersByIncomeLevel = async () => {
  const rows = await getOrdersByIncomeLevelQuery();
  return rows.map(({ income_level, total_orders }) => ({ income_level, total_orders }));
};

// ─── Page 2: Top Products by Orders ──────────────────────────────────────────

export const getTopProductsByOrders = async (limit) => {
  const safeLimit = parseLimit(limit, 10);
  return getTopProductsByOrdersQuery(safeLimit);
};

// ─── Page 2: Profit Trending ──────────────────────────────────────────────────

export const getProfitTrending = async (productKey) => {
  const parsedKey = productKey !== undefined ? Number.parseInt(productKey, 10) : undefined;
  const safeKey = !Number.isNaN(parsedKey) && parsedKey > 0 ? parsedKey : undefined;
  return getProfitTrendingQuery(safeKey);
};
