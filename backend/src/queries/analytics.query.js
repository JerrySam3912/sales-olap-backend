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
      (SELECT COALESCE(SUM(order_quantity),0) FROM fact_sales)    AS total_quantity_sold,
      (SELECT COALESCE(SUM(return_quantity),0)FROM fact_returns)  AS total_return_quantity,
      (SELECT COUNT(*)                        FROM dim_product)   AS total_products,
      (SELECT COUNT(*)                        FROM dim_customer)  AS total_customers,
      (SELECT COUNT(DISTINCT country)         FROM dim_territory) AS total_countries
  `;
  const rows = await query(sql);
  return rows[0];
};

export const getSalesByYearQuery = async () => {
  const sql = `
    SELECT
      dd.year,
      SUM(fs.order_quantity) AS total_quantity_sold
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
      dd.month,
      dd.month_name,
      SUM(fs.order_quantity) AS total_quantity_sold
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
      dp.product_key,
      dp.product_name,
      dp.model_name,
      SUM(fs.order_quantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    GROUP BY dp.product_key, dp.product_name, dp.model_name
    ORDER BY total_quantity_sold DESC, dp.product_name ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getSalesByCountryQuery = async () => {
  const sql = `
    SELECT
      dt.country,
      dt.region,
      SUM(fs.order_quantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_territory dt ON fs.territory_key = dt.territory_key
    GROUP BY dt.country, dt.region
    ORDER BY total_quantity_sold DESC, dt.country ASC
  `;
  return query(sql);
};

export const getSalesByCategoryQuery = async (year, month, date, country) => {
  const params = [];
  const conditions = [];

  const tf = buildTimeConditions(year, month, date);
  conditions.push(...tf.conditions);
  params.push(...tf.params);

  if (country) { conditions.push('dt.country = ?'); params.push(country); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dpc.category_name,
      SUM(fs.order_quantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp           ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_territory dt         ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd              ON fs.order_date = dd.full_date
    ${whereClause}
    GROUP BY dpc.category_name
    ORDER BY total_quantity_sold DESC, dpc.category_name ASC
  `;
  return query(sql, params);
};

export const getReturnsByProductQuery = async (limit) => {
  const sql = `
    SELECT
      dp.product_key,
      dp.product_name,
      SUM(fr.return_quantity) AS total_return_quantity
    FROM fact_returns fr
    INNER JOIN dim_product dp ON fr.product_key = dp.product_key
    GROUP BY dp.product_key, dp.product_name
    ORDER BY total_return_quantity DESC, dp.product_name ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getReturnRateQuery = async (limit) => {
  const sql = `
    SELECT
      dp.product_name,
      COALESCE(s.sold_quantity, 0)   AS sold_quantity,
      COALESCE(r.return_quantity, 0) AS return_quantity,
      CASE
        WHEN COALESCE(s.sold_quantity, 0) = 0 THEN 0
        ELSE ROUND(COALESCE(r.return_quantity, 0) / s.sold_quantity * 100, 2)
      END AS return_rate
    FROM dim_product dp
    LEFT JOIN (
      SELECT product_key, SUM(order_quantity)  AS sold_quantity  FROM fact_sales   GROUP BY product_key
    ) s ON dp.product_key = s.product_key
    LEFT JOIN (
      SELECT product_key, SUM(return_quantity) AS return_quantity FROM fact_returns GROUP BY product_key
    ) r ON dp.product_key = r.product_key
    WHERE COALESCE(s.sold_quantity, 0) > 0
    ORDER BY return_rate DESC, return_quantity DESC, dp.product_name ASC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

export const getSalesDetailQuery = async ({ year, country, category, limit, offset }) => {
  const params = [];
  const conditions = [];

  if (year)     { conditions.push('dd.year = ?');            params.push(Number(year)); }
  if (country)  { conditions.push('dt.country = ?');         params.push(country); }
  if (category) { conditions.push('dpc.category_name = ?');  params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      fs.sales_key,
      fs.order_number,
      fs.order_line_item,
      fs.order_quantity,
      dd.year,
      dd.month,
      dd.month_name,
      dd.full_date        AS order_date,
      dp.product_name,
      dp.model_name,
      dpc.category_name,
      CONCAT(dc.first_name, ' ', dc.last_name) AS customer_name,
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

  if (year)     { conditions.push('dd.year = ?');            params.push(Number(year)); }
  if (country)  { conditions.push('dt.country = ?');         params.push(country); }
  if (category) { conditions.push('dpc.category_name = ?');  params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) AS total_records
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

// ─── Page 1: Executive KPIs ───────────────────────────────────────────────────

export const getExecutiveSalesKPIsQuery = async ({ year, month, date }) => {
  const tf = buildTimeConditions(year, month, date);
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      ROUND(SUM(fs.order_quantity * dp.product_price), 2)                    AS total_revenue,
      ROUND(SUM(fs.order_quantity * (dp.product_price - dp.product_cost)), 2) AS total_profit,
      COUNT(*)                                                                AS total_orders,
      SUM(fs.order_quantity)                                                  AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    INNER JOIN dim_date dd    ON fs.order_date  = dd.full_date
    ${whereClause}
  `;
  const rows = await query(sql, tf.params);
  return rows[0];
};

export const getExecutiveReturnQuantityQuery = async ({ year, month, date }) => {
  const tf = buildTimeConditions(year, month, date, 'dd');
  const whereClause = tf.conditions.length ? `WHERE ${tf.conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COALESCE(SUM(fr.return_quantity), 0) AS total_return_quantity
    FROM fact_returns fr
    INNER JOIN dim_date dd ON fr.return_date = dd.full_date
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
    conditions.push('dd.year = ?'); params.push(Number(year));
  } else if (layer === 'day') {
    if (year)  { conditions.push('dd.year = ?');  params.push(Number(year)); }
    if (month) { conditions.push('dd.month = ?'); params.push(Number(month)); }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let selectFields, groupBy, orderBy;

  if (layer === 'month') {
    selectFields = `dd.year, dd.month, dd.month_name,
      ROUND(SUM(fs.order_quantity * dp.product_price), 2) AS total_revenue`;
    groupBy = 'dd.year, dd.month, dd.month_name';
    orderBy = 'dd.year ASC, dd.month ASC';
  } else if (layer === 'day') {
    selectFields = `dd.full_date, dd.year, dd.month, dd.month_name,
      ROUND(SUM(fs.order_quantity * dp.product_price), 2) AS total_revenue`;
    groupBy = 'dd.full_date, dd.year, dd.month, dd.month_name';
    orderBy = 'dd.full_date ASC';
  } else {
    selectFields = `dd.year,
      ROUND(SUM(fs.order_quantity * dp.product_price), 2) AS total_revenue`;
    groupBy = 'dd.year';
    orderBy = 'dd.year ASC';
  }

  const sql = `
    SELECT ${selectFields}
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    INNER JOIN dim_date dd    ON fs.order_date  = dd.full_date
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
      dt.country,
      COUNT(*)                                                                    AS total_orders,
      ROUND(SUM(fs.order_quantity * dp.product_price), 2)                        AS total_revenue,
      ROUND(
        COALESCE(r.return_quantity, 0) / NULLIF(SUM(fs.order_quantity), 0) * 100, 2
      )                                                                           AS return_rate
    FROM fact_sales fs
    INNER JOIN dim_product dp   ON fs.product_key  = dp.product_key
    INNER JOIN dim_territory dt ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd      ON fs.order_date   = dd.full_date
    LEFT JOIN (
      SELECT dt2.country, SUM(fr.return_quantity) AS return_quantity
      FROM fact_returns fr
      INNER JOIN dim_territory dt2 ON fr.territory_key = dt2.territory_key
      GROUP BY dt2.country
    ) r ON dt.country = r.country
    ${whereClause}
    GROUP BY dt.country, r.return_quantity
    ORDER BY total_revenue DESC
    LIMIT ?
  `;
  return query(sql, [...tf.params, limit]);
};

// ─── Page 2: Customer KPIs ────────────────────────────────────────────────────

export const getCustomerKPIsQuery = async () => {
  const sql = `
    SELECT
      COUNT(DISTINCT fs.customer_key) AS unique_customers,
      ROUND(
        SUM(fs.order_quantity * dp.product_price) / NULLIF(COUNT(DISTINCT fs.customer_key), 0),
        2
      ) AS revenue_per_customer
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
  `;
  const rows = await query(sql);
  return rows[0];
};

// ─── Page 2: Orders by Income Level (donut chart) ─────────────────────────────

export const getOrdersByIncomeLevelQuery = async () => {
  const sql = `
    SELECT
      CASE
        WHEN dc.annual_income < 40000  THEN 'Low'
        WHEN dc.annual_income < 80000  THEN 'Average'
        WHEN dc.annual_income < 120000 THEN 'High'
        ELSE 'Very High'
      END AS income_level,
      COUNT(*) AS total_orders,
      MIN(dc.annual_income) AS min_income
    FROM fact_sales fs
    INNER JOIN dim_customer dc ON fs.customer_key = dc.customer_key
    GROUP BY income_level
    ORDER BY min_income ASC
  `;
  return query(sql);
};

// ─── Page 2: Top Products by Orders (table) ───────────────────────────────────

export const getTopProductsByOrdersQuery = async (limit) => {
  const sql = `
    SELECT
      dp.product_key,
      dp.product_name,
      COUNT(*) AS total_orders,
      ROUND(SUM(fs.order_quantity * dp.product_price), 2) AS total_revenue,
      ROUND(
        COALESCE(r.return_quantity, 0) / NULLIF(SUM(fs.order_quantity), 0) * 100, 2
      ) AS return_rate
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    LEFT JOIN (
      SELECT product_key, SUM(return_quantity) AS return_quantity
      FROM fact_returns GROUP BY product_key
    ) r ON dp.product_key = r.product_key
    GROUP BY dp.product_key, dp.product_name, r.return_quantity
    ORDER BY total_orders DESC
    LIMIT ?
  `;
  return query(sql, [limit]);
};

// ─── Page 2: Profit Trending by Month (line chart) ───────────────────────────

export const getProfitTrendingQuery = async (productKey) => {
  const params = [];
  const conditions = [];

  if (productKey) { conditions.push('fs.product_key = ?'); params.push(Number(productKey)); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dd.year,
      dd.month,
      dd.month_name,
      ROUND(SUM(fs.order_quantity * (dp.product_price - dp.product_cost)), 2) AS total_profit
    FROM fact_sales fs
    INNER JOIN dim_product dp ON fs.product_key = dp.product_key
    INNER JOIN dim_date dd    ON fs.order_date  = dd.full_date
    ${whereClause}
    GROUP BY dd.year, dd.month, dd.month_name
    ORDER BY dd.year ASC, dd.month ASC
  `;
  return query(sql, params);
};
