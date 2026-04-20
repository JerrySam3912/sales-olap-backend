import {
  getOverviewQuery,
  getReturnRateQuery,
  getReturnsByMonthQuery,
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

export const getSalesByCategory = async ({ year, country, subcategory }) => {
  return getSalesByCategoryQuery(year, country, subcategory);
};

export const getReturnsByMonth = async (year) => {
  return getReturnsByMonthQuery(year);
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
    total: totalResult.total_records,
    page: pagination.page,
    limit: pagination.limit
  });
};
