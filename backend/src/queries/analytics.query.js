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

// ─── Existing endpoints ───────────────────────────────────────────────────────

export const getOverviewQuery = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(*)                        FROM fact_sales)    AS total_orders,
      (SELECT COALESCE(SUM(OrderQuantity),0) FROM fact_sales)    AS total_quantity_sold,
      (SELECT COALESCE(SUM(ReturnQuantity),0)FROM fact_return)  AS total_return_quantity,
      (SELECT COUNT(*)                        FROM dim_product)   AS total_products,
      (SELECT COUNT(*)                        FROM dim_customer)  AS total_customers,
      (SELECT COUNT(DISTINCT Country)         FROM dim_territory) AS total_countries
  `;
  const rows = await query(sql);
  return rows[0];
};

export const getSalesByYearQuery = async () => {
  const sql = `
    SELECT
      dd.Year,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_calendar dd ON fs.OrderDate = dd.Date
    GROUP BY dd.Year
    ORDER BY dd.Year ASC
  `;
  return query(sql);
};

export const getSalesByMonthQuery = async (year) => {
  const params = [];
  let whereClause = '';
  if (year) { whereClause = 'WHERE dd.Year = ?'; params.push(Number(year)); }

  const sql = `
    SELECT
      dd.Year,
      dd.MonthNumber,
      dd.MonthName,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_calendar dd ON fs.OrderDate = dd.Date
    ${whereClause}
    GROUP BY dd.Year, dd.MonthNumber, dd.MonthName
    ORDER BY dd.Year ASC, dd.MonthNumber ASC
  `;
  return query(sql, params);
};

export const getTopProductsQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductKey,
      dp.ProductName,
      dp.ModelName,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    GROUP BY dp.ProductKey, dp.ProductName, dp.ModelName
    ORDER BY total_quantity_sold DESC, dp.ProductName ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getSalesByCountryQuery = async () => {
  const sql = `
    SELECT
      dt.Country,
      dt.Region,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_territory dt ON fs.TerritoryKey = dt.SalesTerritoryKey
    GROUP BY dt.Country, dt.Region
    ORDER BY total_quantity_sold DESC, dt.Country ASC
  `;
  return query(sql);
};

export const getSalesByCategoryQuery = async (year, month, date, Country) => {
  const params = [];
  const conditions = [];

  const tf = buildTimeConditions(year, month, date);
  conditions.push(...tf.conditions);
  params.push(...tf.params);

  if (Country) { conditions.push('dt.Country = ?'); params.push(Country); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dpc.CategoryName,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp           ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_product_subcategory dps ON dp.ProductSubcategoryKey = dps.ProductSubcategoryKey
    INNER JOIN dim_product_category dpc ON dps.ProductCategoryKey = dpc.ProductCategoryKey
    INNER JOIN dim_territory dt         ON fs.TerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd              ON fs.OrderDate = dd.Date
    ${whereClause}
    GROUP BY dpc.CategoryName
    ORDER BY total_quantity_sold DESC, dpc.CategoryName ASC
  `;
  return query(sql, params);
};

export const getReturnsByProductQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductKey,
      dp.ProductName,
      SUM(fr.ReturnQuantity) AS total_return_quantity
    FROM fact_return fr
    INNER JOIN dim_product dp ON fr.ProductKey = dp.ProductKey
    GROUP BY dp.ProductKey, dp.ProductName
    ORDER BY total_return_quantity DESC, dp.ProductName ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getReturnRateQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductName,
      COALESCE(s.sold_quantity, 0)   AS sold_quantity,
      COALESCE(r.return_quantity, 0) AS return_quantity,
      CASE
        WHEN COALESCE(s.sold_quantity, 0) = 0 THEN 0
        ELSE ROUND(COALESCE(r.return_quantity, 0) / s.sold_quantity * 100, 2)
      END AS return_rate
    FROM dim_product dp
    LEFT JOIN (
      SELECT ProductKey, SUM(OrderQuantity)  AS sold_quantity  FROM fact_sales   GROUP BY ProductKey
    ) s ON dp.ProductKey = s.ProductKey
    LEFT JOIN (
      SELECT ProductKey, SUM(ReturnQuantity) AS return_quantity FROM fact_return GROUP BY ProductKey
    ) r ON dp.ProductKey = r.ProductKey
    WHERE COALESCE(s.sold_quantity, 0) > 0
    ORDER BY return_rate DESC, return_quantity DESC, dp.ProductName ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getSalesDetailQuery = async ({ year, Country, category, limit, offset }) => {
  const params = [];
  const conditions = [];

  if (year)     { conditions.push('dd.Year = ?');            params.push(Number(year)); }
  if (Country)  { conditions.push('dt.Country = ?');         params.push(Country); }
  if (category) { conditions.push('dpc.CategoryName = ?');  params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      CONCAT(fs.OrderNumber, "-", fs.OrderLineItem) AS sales_key,
      fs.OrderNumber,
      fs.OrderLineItem,
      fs.OrderQuantity,
      dd.Year,
      dd.MonthNumber,
      dd.MonthName,
      dd.Date        AS order_date,
      dp.ProductName,
      dp.ModelName,
      dpc.CategoryName,
      CONCAT(dc.FirstName, ' ', dc.LastName) AS customer_name,
      dc.Gender,
      dc.Occupation,
      dt.Country,
      dt.Region,
      dt.Continent
    FROM fact_sales fs
    INNER JOIN dim_product dp              ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_product_subcategory dps ON dp.ProductSubcategoryKey = dps.ProductSubcategoryKey
    INNER JOIN dim_product_category dpc    ON dps.ProductCategoryKey = dpc.ProductCategoryKey
    INNER JOIN dim_customer dc             ON fs.CustomerKey = dc.CustomerKey
    INNER JOIN dim_territory dt            ON fs.TerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd                 ON fs.OrderDate = dd.Date
    ${whereClause}
    ORDER BY dd.Year DESC, dd.MonthNumber DESC, sales_key DESC
    LIMIT ? OFFSET ?
  `;
  return query(sql, [...params, limit, offset]);
};

export const getSalesDetailCountQuery = async ({ year, Country, category }) => {
  const params = [];
  const conditions = [];

  if (year)     { conditions.push('dd.Year = ?');            params.push(Number(year)); }
  if (Country)  { conditions.push('dt.Country = ?');         params.push(Country); }
  if (category) { conditions.push('dpc.CategoryName = ?');  params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) AS total_records
    FROM fact_sales fs
    INNER JOIN dim_product dp              ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_product_subcategory dps ON dp.ProductSubcategoryKey = dps.ProductSubcategoryKey
    INNER JOIN dim_product_category dpc    ON dps.ProductCategoryKey = dpc.ProductCategoryKey
    INNER JOIN dim_territory dt            ON fs.TerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd                 ON fs.OrderDate = dd.Date
    ${whereClause}
  `;
  const rows = await query(sql, params);
  return rows[0];
};

// ─── Page 1: Executive KPIs ───────────────────────────────────────────────────

export const getExecutiveSalesKPIsQuery = async ({ year, month, date }) => {
  const tf = buildTimeConditions(year, month, date);
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2)                    AS total_revenue,
      ROUND(SUM(fs.OrderQuantity * (dp.ProductPrice - dp.ProductCost)), 2) AS total_profit,
      COUNT(*)                                                                AS total_orders,
      SUM(fs.OrderQuantity)                                                  AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_calendar dd    ON fs.OrderDate  = dd.Date
    ${whereClause}
  `;
  const rows = await query(sql, tf.params);
  return rows[0];
};

export const getExecutiveReturnQuantityQuery = async ({ year, month, date }) => {
  const tf = buildTimeConditions(year, month, date, 'dd');
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COALESCE(SUM(fr.ReturnQuantity), 0) AS total_return_quantity
    FROM fact_return fr
    INNER JOIN dim_calendar dd ON fr.ReturnDate = dd.Date
    ${whereClause}
  `;
  const rows = await query(sql, tf.params);
  return rows[0];
};

// ─── Page 1: Revenue Trending (drill-down) ────────────────────────────────────

export const getRevenueTrendingQuery = async ({ layer, year, month }) => {
  const params = [];
  const conditions = [];

  if (layer === 'month' && year) {
    conditions.push('dd.Year = ?'); params.push(Number(year));
  } else if (layer === 'day') {
    if (year)  { conditions.push('dd.Year = ?');  params.push(Number(year)); }
    if (month) { conditions.push('dd.MonthNumber = ?'); params.push(Number(month)); }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let selectFields, groupBy, orderBy;

  if (layer === 'month') {
    selectFields = `dd.Year, dd.MonthNumber, dd.MonthName,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2) AS total_revenue`;
    groupBy = 'dd.Year, dd.MonthNumber, dd.MonthName';
    orderBy = 'dd.Year ASC, dd.MonthNumber ASC';
  } else if (layer === 'day') {
    selectFields = `dd.Date, dd.Year, dd.MonthNumber, dd.MonthName,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2) AS total_revenue`;
    groupBy = 'dd.Date, dd.Year, dd.MonthNumber, dd.MonthName';
    orderBy = 'dd.Date ASC';
  } else {
    selectFields = `dd.Year,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2) AS total_revenue`;
    groupBy = 'dd.Year';
    orderBy = 'dd.Year ASC';
  }

  const sql = `
    SELECT ${selectFields}
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_calendar dd    ON fs.OrderDate  = dd.Date
    ${whereClause}
    GROUP BY ${groupBy}
    ORDER BY ${orderBy}
  `;
  return query(sql, params);
};

// ─── Page 1: Country Stats Table ─────────────────────────────────────────────

export const getCountryStatsQuery = async ({ year, month, date, limit }) => {
  const tf = buildTimeConditions(year, month, date);
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dt.Country,
      COUNT(*)                                                                    AS total_orders,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2)                        AS total_revenue,
      ROUND(
        COALESCE(r.return_quantity, 0) / NULLIF(SUM(fs.OrderQuantity), 0) * 100, 2
      )                                                                           AS return_rate
    FROM fact_sales fs
    INNER JOIN dim_product dp   ON fs.ProductKey  = dp.ProductKey
    INNER JOIN dim_territory dt ON fs.TerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd      ON fs.OrderDate   = dd.Date
    LEFT JOIN (
      SELECT dt2.Country, SUM(fr.ReturnQuantity) AS return_quantity
      FROM fact_return fr
      INNER JOIN dim_territory dt2 ON fr.TerritoryKey = dt2.SalesTerritoryKey
      GROUP BY dt2.Country
    ) r ON dt.Country = r.Country
    ${whereClause}
    GROUP BY dt.Country, r.return_quantity
    ORDER BY total_revenue DESC
    LIMIT ?
  `;
  return query(sql, [...tf.params, limit]);
};

// ─── Page 2: Customer KPIs ────────────────────────────────────────────────────

export const getCustomerKPIsQuery = async () => {
  const sql = `
    SELECT
      COUNT(DISTINCT fs.CustomerKey) AS unique_customers,
      ROUND(
        SUM(fs.OrderQuantity * dp.ProductPrice) / NULLIF(COUNT(DISTINCT fs.CustomerKey), 0),
        2
      ) AS revenue_per_customer
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
  `;
  const rows = await query(sql);
  return rows[0];
};

// ─── Page 2: Orders by Income Level (donut chart) ─────────────────────────────

export const getOrdersByIncomeLevelQuery = async () => {
  const sql = `
    SELECT
      CASE
        WHEN dc.AnnualIncome < 40000  THEN 'Low'
        WHEN dc.AnnualIncome < 80000  THEN 'Average'
        WHEN dc.AnnualIncome < 120000 THEN 'High'
        ELSE 'Very High'
      END AS income_level,
      COUNT(*) AS total_orders,
      MIN(dc.AnnualIncome) AS min_income
    FROM fact_sales fs
    INNER JOIN dim_customer dc ON fs.CustomerKey = dc.CustomerKey
    GROUP BY income_level
    ORDER BY min_income ASC
  `;
  return query(sql);
};

// ─── Page 2: Top Products by Orders (table) ───────────────────────────────────

export const getTopProductsByOrdersQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductKey,
      dp.ProductName,
      COUNT(*) AS total_orders,
      ROUND(SUM(fs.OrderQuantity * dp.ProductPrice), 2) AS total_revenue,
      ROUND(
        COALESCE(r.return_quantity, 0) / NULLIF(SUM(fs.OrderQuantity), 0) * 100, 2
      ) AS return_rate
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    LEFT JOIN (
      SELECT ProductKey, SUM(ReturnQuantity) AS return_quantity
      FROM fact_return GROUP BY ProductKey
    ) r ON dp.ProductKey = r.ProductKey
    GROUP BY dp.ProductKey, dp.ProductName, r.return_quantity
    ORDER BY total_orders DESC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

// ─── Page 2: Profit Trending by Month (line chart) ───────────────────────────

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
      ROUND(SUM(fs.OrderQuantity * (dp.ProductPrice - dp.ProductCost)), 2) AS total_profit
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_calendar dd    ON fs.OrderDate  = dd.Date
    ${whereClause}
    GROUP BY dd.Year, dd.MonthNumber, dd.MonthName
    ORDER BY dd.Year ASC, dd.MonthNumber ASC
  `;
  return query(sql, params);
};
