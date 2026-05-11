import * as analyticsService from '../services/analytics.service.js';
import { sendError, sendMessage, sendSuccess } from '../utils/response.js';

export const healthCheck = async (req, res) => {
  return sendMessage(res, 'API is running');
};

export const getOverview = async (req, res) => {
  try {
    const data = await analyticsService.getOverview();
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getSalesByYear = async (req, res) => {
  try {
    const data = await analyticsService.getSalesByYear();
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getSalesByMonth = async (req, res) => {
  try {
    const { year } = req.query;
    const data = await analyticsService.getSalesByMonth(year);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await analyticsService.getTopProducts(limit);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getSalesByCountry = async (req, res) => {
  try {
    const data = await analyticsService.getSalesByCountry();
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getSalesByCategory = async (req, res) => {
  try {
    const { year, country, month, date } = req.query;
    const data = await analyticsService.getSalesByCategory({ year, country, month, date });
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getExecutiveKPIs = async (req, res) => {
  try {
    const { year, month, date } = req.query;
    const data = await analyticsService.getExecutiveKPIs({ year, month, date });
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getRevenueTrending = async (req, res) => {
  try {
    const { layer, year, month } = req.query;
    const data = await analyticsService.getRevenueTrending({ layer, year, month });
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getCountryStats = async (req, res) => {
  try {
    const { year, month, date, limit, sortBy, sort_by: sortByLegacy } = req.query;
    const data = await analyticsService.getCountryStats({
      year,
      month,
      date,
      limit,
      sortBy: sortBy ?? sortByLegacy
    });
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getReturnsByProduct = async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await analyticsService.getReturnsByProduct(limit);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getReturnRate = async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await analyticsService.getReturnRate(limit);
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getSalesDetail = async (req, res) => {
  try {
    const { year, country, category, page, limit } = req.query;
    const data = await analyticsService.getSalesDetail({
      year,
      country,
      category,
      page,
      limit
    });

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getOrdersByIncomeLevel = async (req, res) => {
  try {
    const data = await analyticsService.getOrdersByIncomeLevel();
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};

export const getOrdersByOccupation = async (req, res) => {
  try {
    const data = await analyticsService.getOrdersByOccupation();
    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res);
  }
};
