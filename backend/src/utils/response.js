export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendMessage = (res, message, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message
  });
};

export const sendError = (res, message = 'Internal server error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

export const sendValidationError = (res, message = 'Invalid request parameters') => {
  return res.status(400).json({
    success: false,
    message
  });
};

export const getPagination = (page = 1, limit = 10) => {
  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  const safePage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const safeLimit = Number.isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset
  };
};

export const buildPaginatedResponse = ({ rows, total, page, limit }) => {
  const totalRecords = Number(total) || 0;
  const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total_records: totalRecords,
      total_pages: totalPages
    }
  };
};
