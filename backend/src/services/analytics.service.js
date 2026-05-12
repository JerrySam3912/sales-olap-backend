import {
  getCountryStatsQuery,
  getExecutiveReturnQuantityQuery,
  getExecutiveSalesKPIsQuery,
  getGlobalReturnRateQuery,
  getOrdersByIncomeLevelQuery,
  getOrdersByOccupationQuery,
  getOrdersByGenderQuery,
  getOverviewQuery,
  getRevenueTrendingQuery,
  getReturnRateQuery,
  getReturnsByProductQuery,
  getSalesByCategoryQuery,
  getSalesByCountryQuery,
  getSalesByMonthQuery,
  getSalesByYearQuery,
  getSalesDetailCountQuery,
  getSalesDetailQuery,
  getTopProductsQuery
} from '../queries/analytics.query.js';
import { buildPaginatedResponse, getPagination } from '../utils/response.js';

const parseLimit = (limit, fallback = 10) => {
  const parsedLimit = Number.parseInt(limit, 10);
  return Number.isNaN(parsedLimit) || parsedLimit < 1 ? fallback : parsedLimit;
};

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

export const getSalesByCategory = async ({ year, country, month, date }) => {
  return getSalesByCategoryQuery({ year, country, month, date });
};

export const getExecutiveKPIs = async ({ year, month, date }) => {
  const [salesKPIs, returnQuantity, globalReturnRate] = await Promise.all([
    getExecutiveSalesKPIsQuery({ year, month, date }),
    getExecutiveReturnQuantityQuery({ year, month, date }),
    getGlobalReturnRateQuery()
  ]);

  return {
    ...salesKPIs,
    totalReturnQuantity: Number(returnQuantity?.totalReturnQuantity) || 0,
    globalReturnRate: Number(globalReturnRate?.globalReturnRate) || 0
  };
};

export const getRevenueTrending = async ({ layer, year, month }) => {
  return getRevenueTrendingQuery({ layer, year, month });
};

export const getCountryStats = async ({ year, month, date, limit, sortBy }) => {
  const safeLimit = parseLimit(limit, 10);
  return getCountryStatsQuery({
    year,
    month,
    date,
    limit: safeLimit,
    sortBy
  });
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
  const filters = {
    year,
    country,
    category
  };

  const [rows, totalResult] = await Promise.all([
    getSalesDetailQuery({
      ...filters,
      limit: pagination.limit,
      offset: pagination.offset
    }),
    getSalesDetailCountQuery(filters)
  ]);

  return buildPaginatedResponse({
    rows,
    total: totalResult.totalRecords,
    page: pagination.page,
    limit: pagination.limit
  });
};

export const getOrdersByIncomeLevel = async () => {
  return getOrdersByIncomeLevelQuery();
};

export const getOrdersByOccupation = async () => {
  return getOrdersByOccupationQuery();
};

export const getOrdersByGender = async () => {
  return getOrdersByGenderQuery();
};

