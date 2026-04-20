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
  const { year, country, subcategory } = req.query;

  if (!isValidYear(year)) {
    return sendValidationError(res, 'Query parameter "year" must be a valid year.');
  }

  if (!isNonEmptyString(country)) {
    return sendValidationError(res, 'Query parameter "country" must be a non-empty string.');
  }

  if (!isNonEmptyString(subcategory)) {
    return sendValidationError(res, 'Query parameter "subcategory" must be a non-empty string.');
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
