import { query } from '../config/db.js';

export const getOverviewQuery = async () => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM fact_sales) AS total_orders,
      (SELECT COALESCE(SUM(OrderQuantity), 0) FROM fact_sales) AS total_quantity_sold,
      (SELECT COALESCE(SUM(ReturnQuantity), 0) FROM fact_return) AS total_return_quantity,
      (SELECT COUNT(*) FROM dim_product) AS total_products,
      (SELECT COUNT(*) FROM dim_customer) AS total_customers,
      (SELECT COUNT(DISTINCT Country) FROM dim_territory) AS total_countries
  `;

  const rows = await query(sql);
  return rows[0];
};

export const getSalesByYearQuery = async () => {
  const sql = `
    SELECT
      dd.Year AS year,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_calendar dd
      ON fs.OrderDate = dd.Date
    GROUP BY dd.Year
    ORDER BY dd.Year ASC
  `;

  return query(sql);
};

export const getSalesByMonthQuery = async (year) => {
  const params = [];
  let whereClause = '';

  if (year) {
    whereClause = 'WHERE dd.Year = ?';
    params.push(Number(year));
  }

  const sql = `
    SELECT
      dd.Year AS year,
      dd.MonthNumber AS month,
      dd.MonthName AS month_name,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_calendar dd
      ON fs.OrderDate = dd.Date
    ${whereClause}
    GROUP BY dd.Year, dd.MonthNumber, dd.MonthName
    ORDER BY dd.Year ASC, dd.MonthNumber ASC
  `;

  return query(sql, params);
};

export const getTopProductsQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductKey AS product_key,
      dp.ProductName AS product_name,
      dp.ModelName AS model_name,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp
      ON fs.ProductKey = dp.ProductKey
    GROUP BY dp.ProductKey, dp.ProductName, dp.ModelName
    ORDER BY total_quantity_sold DESC, dp.ProductName ASC
    LIMIT ?
  `;

  return query(sql, [limit]);
};

export const getSalesByCountryQuery = async () => {
  const sql = `
    SELECT
      dt.Country AS country,
      dt.Region AS region,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_territory dt
      ON fs.SalesTerritoryKey = dt.SalesTerritoryKey
    GROUP BY dt.Country, dt.Region
    ORDER BY total_quantity_sold DESC, dt.Country ASC
  `;

  return query(sql);
};

export const getSalesByCategoryQuery = async (year, country) => {
  const params = [];
  const conditions = [];

  if (year) {
    conditions.push('dd.Year = ?');
    params.push(Number(year));
  }

  if (country) {
    conditions.push('dt.Country = ?');
    params.push(country);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      dpc.CategoryName AS category_name,
      SUM(fs.OrderQuantity) AS total_quantity_sold
    FROM fact_sales fs
    INNER JOIN dim_product dp
      ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_product_subcategory dps
      ON dp.ProductSubcategoryKey = dps.ProductSubcategoryKey
    INNER JOIN dim_product_category dpc
      ON dps.ProductCategoryKey = dpc.ProductCategoryKey
    INNER JOIN dim_territory dt
      ON fs.SalesTerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd
      ON fs.OrderDate = dd.Date
    ${whereClause}
    GROUP BY dpc.CategoryName
    ORDER BY total_quantity_sold DESC, dpc.CategoryName ASC
  `;

  return query(sql, params);
};

export const getReturnsByProductQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductKey AS product_key,
      dp.ProductName AS product_name,
      SUM(fr.ReturnQuantity) AS total_return_quantity
    FROM fact_return fr
    INNER JOIN dim_product dp
      ON fr.ProductKey = dp.ProductKey
    GROUP BY dp.ProductKey, dp.ProductName
    ORDER BY total_return_quantity DESC, dp.ProductName ASC
    LIMIT ?
  `;

  return query(sql, [limit]);
};

export const getReturnRateQuery = async (limit) => {
  const sql = `
    SELECT
      dp.ProductName AS product_name,
      COALESCE(sales.sold_quantity, 0) AS sold_quantity,
      COALESCE(returns.return_quantity, 0) AS return_quantity,
      CASE
        WHEN COALESCE(sales.sold_quantity, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(returns.return_quantity, 0) / sales.sold_quantity) * 100, 2)
      END AS return_rate
    FROM dim_product dp
    LEFT JOIN (
      SELECT
        ProductKey,
        SUM(OrderQuantity) AS sold_quantity
      FROM fact_sales
      GROUP BY ProductKey
    ) sales
      ON dp.ProductKey = sales.ProductKey
    LEFT JOIN (
      SELECT
        ProductKey,
        SUM(ReturnQuantity) AS return_quantity
      FROM fact_return
      GROUP BY ProductKey
    ) returns
      ON dp.ProductKey = returns.ProductKey
    WHERE COALESCE(sales.sold_quantity, 0) > 0
    ORDER BY return_rate DESC, return_quantity DESC, dp.ProductName ASC
    LIMIT ?
  `;

  return query(sql, [limit]);
};

export const getSalesDetailQuery = async ({ year, country, category, limit, offset }) => {
  const params = [];
  const conditions = [];

  if (year) {
    conditions.push('dd.Year = ?');
    params.push(Number(year));
  }

  if (country) {
    conditions.push('dt.Country = ?');
    params.push(country);
  }

  if (category) {
    conditions.push('dpc.CategoryName = ?');
    params.push(category);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      fs.OrderNumber AS order_number,
      fs.OrderLineItem AS order_line_item,
      fs.OrderQuantity AS order_quantity,
      dd.Year AS year,
      dd.MonthNumber AS month,
      dd.MonthName AS month_name,
      dd.Date AS order_date,
      dp.ProductName AS product_name,
      dp.ModelName AS model_name,
      dpc.CategoryName AS category_name,
      CONCAT(dc.FirstName, ' ', dc.LastName) AS customer_name,
      dc.Gender AS gender,
      dc.Occupation AS occupation,
      dt.Country AS country,
      dt.Region AS region,
      dt.Continent AS continent
    FROM fact_sales fs
    INNER JOIN dim_product dp
      ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_product_subcategory dps
      ON dp.ProductSubcategoryKey = dps.ProductSubcategoryKey
    INNER JOIN dim_product_category dpc
      ON dps.ProductCategoryKey = dpc.ProductCategoryKey
    INNER JOIN dim_customer dc
      ON fs.CustomerKey = dc.CustomerKey
    INNER JOIN dim_territory dt
      ON fs.SalesTerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd
      ON fs.OrderDate = dd.Date
    ${whereClause}
    ORDER BY dd.Year DESC, dd.MonthNumber DESC, fs.OrderNumber DESC, fs.OrderLineItem DESC
    LIMIT ? OFFSET ?
  `;

  return query(sql, [...params, limit, offset]);
};

export const getSalesDetailCountQuery = async ({ year, country, category }) => {
  const params = [];
  const conditions = [];

  if (year) {
    conditions.push('dd.Year = ?');
    params.push(Number(year));
  }

  if (country) {
    conditions.push('dt.Country = ?');
    params.push(country);
  }

  if (category) {
    conditions.push('dpc.CategoryName = ?');
    params.push(category);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) AS total_records
    FROM fact_sales fs
    INNER JOIN dim_product dp
      ON fs.ProductKey = dp.ProductKey
    INNER JOIN dim_product_subcategory dps
      ON dp.ProductSubcategoryKey = dps.ProductSubcategoryKey
    INNER JOIN dim_product_category dpc
      ON dps.ProductCategoryKey = dpc.ProductCategoryKey
    INNER JOIN dim_territory dt
      ON fs.SalesTerritoryKey = dt.SalesTerritoryKey
    INNER JOIN dim_calendar dd
      ON fs.OrderDate = dd.Date
    ${whereClause}
  `;

  const rows = await query(sql, params);
  return rows[0];
};
