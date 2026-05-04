import { query } from '../config/db.js';

const buildTimeConditions = (year, month, date, alias = 'dd') => {
  const conditions = [];
  const params = [];
  if (date) {
    conditions.push(`${alias}.full_date = ?`);
    params.push(date);
  } else {
    if (year)  { conditions.push(`${alias}.year = ?`);  params.push(Number(year)); }
    if (month) { conditions.push(`${alias}.month = ?`); params.push(Number(month)); }
  }
  return { conditions, params };
};

// existing endpoints 

export const getOverviewQuery = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(DISTINCT order_number)      FROM fact_sales)    AS totalOrders,
      (SELECT COALESCE(SUM(order_quantity),0)   FROM fact_sales)    AS totalQuantitySold,
      (SELECT COALESCE(SUM(return_quantity),0)  FROM fact_returns)  AS totalReturnQuantity,
      (SELECT COUNT(*)                          FROM dim_product)   AS totalProducts,
      (SELECT COUNT(*)                          FROM dim_customer)  AS totalCustomers,
      (SELECT COUNT(DISTINCT country)           FROM dim_territory) AS totalCountries
  `;
  const rows = await query(sql);
  return rows[0];
};

export const getSalesByYearQuery = async () => {
  const sql = `
    SELECT
      dd.year,
      SUM(fs.order_quantity) AS totalQuantitySold
    FROM fact_sales fs
    INNER JOIN dim_date dd ON fs.order_date = dd.full_date
    GROUP BY dd.year
    ORDER BY dd.year ASC
  `;
  return query(sql);
};

export const getSalesByMonthQuery = async (year) => {
  const params = [];
  let whereClause = '';
  if (year) { whereClause = 'WHERE dd.year = ?'; params.push(Number(year)); }

  const sql = `
    SELECT
      dd.year,
      dd.month AS monthNumber,
      dd.month_name AS monthName,
      SUM(fs.order_quantity) AS totalQuantitySold
    FROM fact_sales fs
    INNER JOIN dim_date dd ON fs.order_date = dd.full_date
    ${whereClause}
    GROUP BY dd.year, dd.month, dd.month_name
    ORDER BY dd.year ASC, dd.month ASC
  `;
  return query(sql, params);
};

export const getTopProductsQuery = async (limit) => {
  const sql = `
    SELECT
      dp.product_key AS productKey,
      dp.product_name AS productName,
      dp.model_name AS modelName,
      SUM(fs.order_quantity) AS totalQuantitySold
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    GROUP BY dp.product_key, dp.product_name, dp.model_name
    ORDER BY totalQuantitySold DESC, dp.product_name ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getSalesByCountryQuery = async () => {
  const sql = `
    SELECT
      dt.country,
      dt.region,
      SUM(fs.order_quantity) AS totalQuantitySold
    FROM fact_sales fs
    INNER JOIN dim_territory dt ON fs.territory_key = dt.territory_key
    GROUP BY dt.country, dt.region
    ORDER BY totalQuantitySold DESC, dt.country ASC
  `;
  return query(sql);
};

export const getSalesByCategoryQuery = async ({ year, country, month, date }) => {
  const params = [];
  const conditions = [];

  const tf = buildTimeConditions(year, month, date);
  conditions.push(...tf.conditions);
  params.push(...tf.params);

  if (country) { conditions.push('dt.country = ?'); params.push(country); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dpc.category_name AS categoryName,
      COUNT(DISTINCT fs.order_number) AS totalOrders,
      COALESCE(SUM(fs.order_quantity), 0) AS totalQuantitySold
    FROM fact_sales fs
    INNER JOIN dim_product dp              ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc    ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_territory dt            ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd                 ON fs.order_date = dd.full_date
    ${whereClause}
    GROUP BY dpc.category_name
    ORDER BY totalQuantitySold DESC, dpc.category_name ASC
  `;
  return query(sql, params);
};

export const getReturnsByProductQuery = async (limit) => {
  const sql = `
    SELECT
      dp.product_key AS productKey,
      dp.product_name AS productName,
      SUM(fr.return_quantity) AS totalReturnQuantity
    FROM fact_returns fr
    INNER JOIN dim_product dp ON fr.product_key = dp.product_key
    GROUP BY dp.product_key, dp.product_name
    ORDER BY totalReturnQuantity DESC, dp.product_name ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getReturnRateQuery = async (limit) => {
  const sql = `
    SELECT
      dp.product_name AS productName,
      COALESCE(s.sold_quantity, 0)   AS soldQuantity,
      COALESCE(r.return_quantity, 0) AS returnQuantity,
      CASE
        WHEN COALESCE(s.sold_quantity, 0) = 0 THEN 0
        ELSE ROUND(COALESCE(r.return_quantity, 0) / s.sold_quantity * 100, 2)
      END AS returnRate
    FROM dim_product dp
    LEFT JOIN (
      SELECT product_key, SUM(order_quantity)  AS sold_quantity  FROM fact_sales   GROUP BY product_key
    ) s ON dp.product_key = s.product_key
    LEFT JOIN (
      SELECT product_key, SUM(return_quantity) AS return_quantity FROM fact_returns GROUP BY product_key
    ) r ON dp.product_key = r.product_key
    WHERE COALESCE(s.sold_quantity, 0) > 0
    ORDER BY returnRate DESC, returnQuantity DESC, dp.product_name ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getSalesDetailQuery = async ({ year, country, category, limit, offset }) => {
  const params = [];
  const conditions = [];

  if (year)     { conditions.push('dd.year = ?');              params.push(Number(year)); }
  if (country)  { conditions.push('dt.country = ?');           params.push(country); }
  if (category) { conditions.push('dpc.category_name = ?');    params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      fs.sales_key AS salesKey,
      fs.order_number AS orderNumber,
      fs.order_line_item AS orderLineItem,
      fs.order_quantity AS orderQuantity,
      dd.year,
      dd.month        AS monthNumber,
      dd.month_name AS monthName,
      dd.full_date    AS orderDate,
      dp.product_name AS productName,
      dp.model_name AS modelName,
      dpc.category_name AS categoryName,
      CONCAT(dc.first_name, ' ', dc.last_name) AS customerName,
      dc.gender,
      dc.occupation,
      dt.country,
      dt.region,
      dt.continent
    FROM fact_sales fs
    INNER JOIN dim_product dp              ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc    ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_customer dc             ON fs.customer_key = dc.customer_key
    INNER JOIN dim_territory dt            ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd                 ON fs.order_date = dd.full_date
    ${whereClause}
    ORDER BY dd.year DESC, dd.month DESC, fs.sales_key DESC
    LIMIT ? OFFSET ?
  `;
  return query(sql, [...params, limit, offset]);
};

export const getSalesDetailCountQuery = async ({ year, country, category }) => {
  const params = [];
  const conditions = [];

  if (year)     { conditions.push('dd.year = ?');              params.push(Number(year)); }
  if (country)  { conditions.push('dt.country = ?');           params.push(country); }
  if (category) { conditions.push('dpc.category_name = ?');    params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) AS totalRecords
    FROM fact_sales fs
    INNER JOIN dim_product dp              ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc    ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_territory dt            ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd                 ON fs.order_date = dd.full_date
    ${whereClause}
  `;
  const rows = await query(sql, params);
  return rows[0];
};

// executive KPIs

export const getExecutiveSalesKPIsQuery = async ({ year, month, date }) => {
  const tf = buildTimeConditions(year, month, date);
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      COUNT(DISTINCT fs.order_number)                                       AS totalOrders,
      ROUND(COALESCE(SUM(fs.order_quantity * dp.product_price), 0), 2)      AS totalRevenue,
      ROUND(COALESCE(SUM(fs.order_quantity * (dp.product_price - dp.product_cost)), 0), 2) AS totalProfit,
      COALESCE(SUM(fs.order_quantity), 0)                                    AS totalQuantitySold
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    INNER JOIN dim_date dd ON fs.order_date = dd.full_date
    ${whereClause}
  `;
  const rows = await query(sql, tf.params);
  return rows[0];
};

export const getExecutiveReturnQuantityQuery = async ({ year, month, date }) => {
  const tf = buildTimeConditions(year, month, date, 'dd');
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COALESCE(SUM(fr.return_quantity), 0) AS totalReturnQuantity
    FROM fact_returns fr
    INNER JOIN dim_date dd ON fr.return_date = dd.full_date
    ${whereClause}
  `;
  const rows = await query(sql, tf.params);
  return rows[0];
};

// global return rate (no time filter): SUM(ReturnQuantity) / SUM(OrderQuantity)
export const getGlobalReturnRateQuery = async () => {
  const sql = `
    SELECT
      ROUND(
        COALESCE((SELECT SUM(return_quantity) FROM fact_returns), 0) /
        NULLIF((SELECT SUM(order_quantity) FROM fact_sales), 0) * 100,
        2
      ) AS globalReturnRate
  `;
  const rows = await query(sql);
  return rows[0];
};

// revenue trending (drill-down) 

export const getRevenueTrendingQuery = async ({ layer, year, month }) => {
  const params = [];
  const conditions = [];

  if (layer === 'month' && year) {
    conditions.push('dd.year = ?'); params.push(Number(year));
  } else if (layer === 'day') {
    if (year)  { conditions.push('dd.year = ?');  params.push(Number(year)); }
    if (month) { conditions.push('dd.month = ?'); params.push(Number(month)); }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let selectFields, groupBy, orderBy;

  if (layer === 'month') {
    selectFields = `
      dd.year,
      dd.month AS monthNumber,
      dd.month_name AS monthName,
      CONCAT(dd.month_name, ' ', dd.year) AS monthYearLabel,
      ROUND(COALESCE(SUM(fs.order_quantity * dp.product_price), 0), 2) AS totalRevenue`;
    groupBy  = 'dd.year, dd.month, dd.month_name';
    orderBy  = 'dd.year ASC, dd.month ASC';
  } else if (layer === 'day') {
    selectFields = `
      dd.full_date AS fullDate,
      ROUND(COALESCE(SUM(fs.order_quantity * dp.product_price), 0), 2) AS totalRevenue`;
    groupBy  = 'dd.full_date';
    orderBy  = 'dd.full_date ASC';
  } else {
    // Default: year layer
    selectFields = `
      dd.year,
      ROUND(COALESCE(SUM(fs.order_quantity * dp.product_price), 0), 2) AS totalRevenue`;
    groupBy  = 'dd.year';
    orderBy  = 'dd.year ASC';
  }

  const sql = `
    SELECT ${selectFields}
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    INNER JOIN dim_date dd ON fs.order_date = dd.full_date
    ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}
  `;
  return query(sql, params);
};

// country stats table 
// sortBy: 'Orders' | 'Revenue' | 'ReturnRate'  (default: 'Revenue')

export const getCountryStatsQuery = async ({ year, month, date, limit, sortBy = 'Revenue' }) => {
  const tf = buildTimeConditions(year, month, date);
  const salesWhere = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  // Validate sortBy to prevent SQL injection
  const allowedSorts = ['Orders', 'Revenue', 'ReturnRate'];
  const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'Revenue';

  const orderExpr =
    safeSort === 'Orders'     ? 's.totalOrders'   :
    safeSort === 'ReturnRate' ? 'returnRate'      :
                                's.totalRevenue';

  const sql = `
    WITH sales_data AS (
      SELECT
        dt.country,
        COUNT(DISTINCT fs.order_number)                                     AS totalOrders,
        COALESCE(SUM(fs.order_quantity), 0)                                 AS totalQuantitySold,
        ROUND(COALESCE(SUM(fs.order_quantity * dp.product_price), 0), 2)    AS totalRevenue
      FROM fact_sales fs
      INNER JOIN dim_territory dt ON fs.territory_key = dt.territory_key
      INNER JOIN dim_product dp   ON fs.product_key = dp.product_key
      INNER JOIN dim_date dd      ON fs.order_date = dd.full_date
      ${salesWhere}
      GROUP BY dt.country
    ),
    return_data AS (
      SELECT dt.country, COALESCE(SUM(fr.return_quantity), 0) AS totalQuantityReturned
      FROM fact_returns fr
      INNER JOIN dim_territory dt ON fr.territory_key = dt.territory_key
      GROUP BY dt.country
    )
    SELECT
      s.country,
      s.totalOrders                                                               AS orders,
      s.totalRevenue                                                              AS revenue,
      ROUND(
        COALESCE(r.totalQuantityReturned, 0) /
        NULLIF(s.totalQuantitySold, 0) * 100,
        2
      )                                                                           AS returnRate
    FROM sales_data s
    LEFT JOIN return_data r ON s.country = r.country
    ORDER BY ${orderExpr} DESC
    LIMIT ?
  `;
  return query(sql, [...tf.params, limit]);
};

// customer KPIs

export const getCustomerKPIsQuery = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(DISTINCT CustomerKey) FROM dim_customer) AS uniqueCustomers,
      ROUND(
        SUM(fs.OrderQuantity * dp.ProductPrice) /
        NULLIF((SELECT COUNT(DISTINCT CustomerKey) FROM dim_customer), 0),
        2
      ) AS revenuePerCustomer
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
  `;
  const rows = await query(sql);
  return rows[0];
};

// orders by gender (donut / bar chart)

export const getOrdersByGenderQuery = async () => {
  const sql = `
    SELECT
      dc.Gender,
      COUNT(DISTINCT fs.OrderNumber) AS orders
    FROM fact_sales fs
    INNER JOIN dim_customer dc ON fs.CustomerKey = dc.CustomerKey
    WHERE dc.Gender != 'U'
    GROUP BY dc.Gender
  `;
  return query(sql);
};

// orders by occupation (bar chart)

export const getOrdersByOccupationQuery = async () => {
  const sql = `
    SELECT
      dc.Occupation,
      COUNT(DISTINCT fs.OrderNumber) AS orders
    FROM fact_sales fs
    INNER JOIN dim_customer dc ON fs.CustomerKey = dc.CustomerKey
    GROUP BY dc.Occupation
    ORDER BY orders DESC
  `;
  return query(sql);
};

// orders by income level (donut chart)

export const getOrdersByIncomeLevelQuery = async () => {
  const sql = `
    SELECT
      CASE
        WHEN dc.AnnualIncome < 40000  THEN 'Low'
        WHEN dc.AnnualIncome < 80000  THEN 'Average'
        WHEN dc.AnnualIncome < 120000 THEN 'High'
        ELSE 'Very High'
      END AS incomeLevel,
      COUNT(*) AS totalOrders,
      MIN(dc.AnnualIncome) AS minIncome
    FROM fact_sales fs
    INNER JOIN dim_customer dc ON fs.CustomerKey = dc.CustomerKey
    GROUP BY incomeLevel
    ORDER BY minIncome ASC
  `;
  return query(sql);
};

// top products by orders (table) 

export const getTopProductsByOrdersQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductKey AS productKey,
      dp.ProductName AS productName,
      COUNT(DISTINCT fs.OrderNumber) AS totalOrders,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2) AS totalRevenue,
      ROUND(
        COALESCE(r.return_quantity, 0) / NULLIF(SUM(fs.OrderQuantity), 0) * 100, 2
      ) AS returnRate
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    LEFT JOIN (
      SELECT ProductKey, SUM(ReturnQuantity) AS return_quantity
      FROM fact_return GROUP BY ProductKey
    ) r ON dp.ProductKey = r.ProductKey
    GROUP BY dp.ProductKey, dp.ProductName, r.return_quantity
    ORDER BY totalOrders DESC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

// profit trending by month (line chart)

export const getProfitTrendingQuery = async (productKey) => {
  const params = [];
  const conditions = [];

  if (productKey) { conditions.push('fs.ProductKey = ?'); params.push(Number(productKey)); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dd.Year,
      dd.MonthNumber,
      dd.MonthName,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2)                          AS totalRevenue,
      ROUND(SUM(fs.OrderQuantity * dp.ProductCost), 2)                           AS totalCost,
      ROUND(SUM(fs.OrderQuantity * (dp.ProductPrice - dp.ProductCost)), 2)       AS totalProfit
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_calendar dd ON fs.OrderDate  = dd.Date
    ${whereClause}
    GROUP BY dd.Year, dd.MonthNumber, dd.MonthName
    ORDER BY dd.Year ASC, dd.MonthNumber ASC
  `;
  return query(sql, params);
};