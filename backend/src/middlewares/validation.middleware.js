import { sendValidationError } from '../utils/response.js';

const isPositiveInteger = (value) => {
  if (value === undefined) {
    return true;
  }

  const parsed = Number.parseInt(value, 10);
  return !Number.isNaN(parsed) && parsed > 0;
};

const isValidYear = (value) => {
  if (value === undefined) {
    return true;
  }

  const parsed = Number.parseInt(value, 10);
  return !Number.isNaN(parsed) && parsed >= 1900 && parsed <= 9999;
};

const isValidMonth = (value) => {
  if (value === undefined) {
    return true;
  }

  const parsed = Number.parseInt(value, 10);
  return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 12;
};

const isValidDate = (value) => {
  if (value === undefined) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const isNonEmptyString = (value) => {
  if (value === undefined) {
    return true;
  }

  return typeof value === 'string' && value.trim().length > 0;
};

export const validateSalesByMonthQuery = (req, res, next) => {
  const { year } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  return next();
};

export const validateLimitQuery = (req, res, next) => {
  const { limit } = req.query;

  if (!isPositiveInteger(limit)) {
    return sendValidationError(res, 'Query parameter "limit" must be a positive integer.');
  }

  return next();
};

export const validateSalesByCategoryQuery = (req, res, next) => {
  const { year, country, month, date } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  if (!isNonEmptyString(country)) {
    return sendValidationError(res, 'Query parameter "country" must be a non-empty string.');
  }

  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }

  if (!isValidDate(date)) {
    return sendValidationError(res, 'Query parameter "date" must be in YYYY-MM-DD format.');
  }

  return next();
};

export const validateExecutiveKPIsQuery = (req, res, next) => {
  const { year, month, date } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }

  if (!isValidDate(date)) {
    return sendValidationError(res, 'Query parameter "date" must be in YYYY-MM-DD format.');
  }

  return next();
};

export const validateRevenueTrendingQuery = (req, res, next) => {
  const { layer, year, month } = req.query;
  const allowedLayers = ['year', 'month', 'day'];

  if (layer !== undefined && !allowedLayers.includes(layer)) {
    return sendValidationError(res, 'Query parameter "layer" must be one of: year, month, day.');
  }

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }

  return next();
};

export const validateCountryStatsQuery = (req, res, next) => {
  const { year, month, date, limit, sortBy, sort_by: sortByLegacy } = req.query;
  const effectiveSortBy = sortBy ?? sortByLegacy;
  const allowedSorts = ['Orders', 'Revenue', 'ReturnRate'];

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }

  if (!isValidDate(date)) {
    return sendValidationError(res, 'Query parameter "date" must be in YYYY-MM-DD format.');
  }

  if (!isPositiveInteger(limit)) {
    return sendValidationError(res, 'Query parameter "limit" must be a positive integer.');
  }

  if (effectiveSortBy !== undefined && !allowedSorts.includes(effectiveSortBy)) {
    return sendValidationError(res, 'Query parameter "sortBy" must be one of: Orders, Revenue, ReturnRate.');
  }

  return next();
};

export const validateSalesDetailQuery = (req, res, next) => {
  const {
    year,
    country,
    category,
    page,
    limit
  } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  if (!isNonEmptyString(country)) {
    return sendValidationError(res, 'Query parameter "country" must be a non-empty string.');
  }

  if (!isNonEmptyString(category)) {
    return sendValidationError(res, 'Query parameter "category" must be a non-empty string.');
  }

  if (!isPositiveInteger(page)) {
    return sendValidationError(res, 'Query parameter "page" must be a positive integer.');
  }

  if (!isPositiveInteger(limit)) {
    return sendValidationError(res, 'Query parameter "limit" must be a positive integer.');
  }

  return next();
};
