import { sendValidationError } from '../utils/response.js';

const isPositiveInteger = (value) => {
  if (value === undefined) return true;
  const parsed = Number.parseInt(value, 10);
  return !Number.isNaN(parsed) && parsed > 0;
};

const isValidYear = (value) => {
  if (value === undefined) return true;
  const parsed = Number.parseInt(value, 10);
  return !Number.isNaN(parsed) && parsed >= 1900 && parsed <= 9999;
};

const isValidMonth = (value) => {
  if (value === undefined) return true;
  const parsed = Number.parseInt(value, 10);
  return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 12;
};

const isValidDate = (value) => {
  if (value === undefined) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
};

const isNonEmptyString = (value) => {
  if (value === undefined) return true;
  return typeof value === 'string' && value.trim().length > 0;
};

const VALID_LAYERS = ['year', 'month', 'day'];

// ─── Existing validators ──────────────────────────────────────────────────────

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
  const { year, month, date, country } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }
  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }
  if (!isValidDate(date)) {
    return sendValidationError(res, 'Query parameter "date" must be in YYYY-MM-DD format.');
  }
  if (!isNonEmptyString(country)) {
    return sendValidationError(res, 'Query parameter "country" must be a non-empty string.');
  }

  return next();
};

export const validateSalesDetailQuery = (req, res, next) => {
  const { year, country, category, page, limit } = req.query;

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

// ─── New validators ───────────────────────────────────────────────────────────

export const validateTimeFilterQuery = (req, res, next) => {
  const { year, month, date, limit } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }
  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }
  if (!isValidDate(date)) {
    return sendValidationError(res, 'Query parameter "date" must be in YYYY-MM-DD format.');
  }
  if (limit !== undefined && !isPositiveInteger(limit)) {
    return sendValidationError(res, 'Query parameter "limit" must be a positive integer.');
  }

  return next();
};

export const validateRevenueTrendingQuery = (req, res, next) => {
  const { layer, year, month } = req.query;

  if (!layer || !VALID_LAYERS.includes(layer)) {
    return sendValidationError(
      res,
      `Query parameter "layer" is required and must be one of: ${VALID_LAYERS.join(', ')}.`
    );
  }
  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }
  if (!isValidMonth(month)) {
    return sendValidationError(res, 'Query parameter "month" must be between 1 and 12.');
  }

  return next();
};

export const validateProductKeyQuery = (req, res, next) => {
  const { product_key } = req.query;
  if (!isPositiveInteger(product_key)) {
    return sendValidationError(res, 'Query parameter "product_key" must be a positive integer.');
  }
  return next();
};
