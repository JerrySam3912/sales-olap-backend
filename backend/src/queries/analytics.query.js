import { query } from '../config/db.js';

export const getOverviewQuery = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM fact_sales) AS total_orders,
      (SELECT COALESCE(SUM(order_quantity), 0) FROM fact_sales) AS total_quantity_sold,
      (SELECT COALESCE(SUM(return_quantity), 0) FROM fact_returns) AS total_return_quantity,
      (SELECT COUNT(*) FROM dim_product) AS total_products,
      (SELECT COUNT(*) FROM dim_customer) AS total_customers,
      (SELECT COUNT(DISTINCT country) FROM dim_territory) AS total_countries
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
    INNER JOIN dim_date dd
      ON fs.order_date = dd.full_date
    GROUP BY dd.year
    ORDER BY dd.year ASC
  `;

  return query(sql);
};

export const getSalesByMonthQuery = async (year) => {
  const params = [];
  let whereClause = '';

  if (year) {
    whereClause = 'WHERE dd.year = ?';
    params.push(Number(year));
  }

  const sql = `
    SELECT
      dd.year,
      dd.month,
      dd.month_name,
      SUM(fs.order_quantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_date dd
      ON fs.order_date = dd.full_date
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
    INNER JOIN dim_product dp
      ON fs.product_key = dp.product_key
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
    INNER JOIN dim_territory dt
      ON fs.territory_key = dt.territory_key
    GROUP BY dt.country, dt.region
    ORDER BY total_quantity_sold DESC, dt.country ASC
  `;

  return query(sql);
};

export const getSalesByCategoryQuery = async (year, country) => {
  const params = [];
  const conditions = [];

  if (year) {
    conditions.push('dd.year = ?');
    params.push(Number(year));
  }

  if (country) {
    conditions.push('dt.country = ?');
    params.push(country);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dpc.category_name,
      SUM(fs.order_quantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp
      ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps
      ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc
      ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_territory dt
      ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd
      ON fs.order_date = dd.full_date
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
    INNER JOIN dim_product dp
      ON fr.product_key = dp.product_key
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
      COALESCE(sales.sold_quantity, 0) AS sold_quantity,
      COALESCE(returns.return_quantity, 0) AS return_quantity,
      CASE
        WHEN COALESCE(sales.sold_quantity, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(returns.return_quantity, 0) / sales.sold_quantity) * 100, 2)
      END AS return_rate
    FROM dim_product dp
    LEFT JOIN (
      SELECT
        product_key,
        SUM(order_quantity) AS sold_quantity
      FROM fact_sales
      GROUP BY product_key
    ) sales
      ON dp.product_key = sales.product_key
    LEFT JOIN (
      SELECT
        product_key,
        SUM(return_quantity) AS return_quantity
      FROM fact_returns
      GROUP BY product_key
    ) returns
      ON dp.product_key = returns.product_key
    WHERE COALESCE(sales.sold_quantity, 0) > 0
    ORDER BY return_rate DESC, return_quantity DESC, dp.product_name ASC
    LIMIT ?
  `;

  return query(sql, [limit]);
};

export const getSalesDetailQuery = async ({ year, country, category, limit, offset }) => {
  const params = [];
  const conditions = [];

  if (year) {
    conditions.push('dd.year = ?');
    params.push(Number(year));
  }

  if (country) {
    conditions.push('dt.country = ?');
    params.push(country);
  }

  if (category) {
    conditions.push('dpc.category_name = ?');
    params.push(category);
  }

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
      dd.full_date AS order_date,
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
    INNER JOIN dim_product dp
      ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps
      ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc
      ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_customer dc
      ON fs.customer_key = dc.customer_key
    INNER JOIN dim_territory dt
      ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd
      ON fs.order_date = dd.full_date
    ${whereClause}
    ORDER BY dd.year DESC, dd.month DESC, fs.sales_key DESC
    LIMIT ? OFFSET ?
  `;

  return query(sql, [...params, limit, offset]);
};

export const getSalesDetailCountQuery = async ({ year, country, category }) => {
  const params = [];
  const conditions = [];

  if (year) {
    conditions.push('dd.year = ?');
    params.push(Number(year));
  }

  if (country) {
    conditions.push('dt.country = ?');
    params.push(country);
  }

  if (category) {
    conditions.push('dpc.category_name = ?');
    params.push(category);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) AS total_records
    FROM fact_sales fs
    INNER JOIN dim_product dp
      ON fs.product_key = dp.product_key
    INNER JOIN dim_product_subcategory dps
      ON dp.product_subcategory_key = dps.product_subcategory_key
    INNER JOIN dim_product_category dpc
      ON dps.product_category_key = dpc.product_category_key
    INNER JOIN dim_territory dt
      ON fs.territory_key = dt.territory_key
    INNER JOIN dim_date dd
      ON fs.order_date = dd.full_date
    ${whereClause}
  `;

  const rows = await query(sql, params);
  return rows[0];
};
