CREATE DATABASE IF NOT EXISTS adventureworks_olap;
USE adventureworks_olap;

DROP TABLE IF EXISTS fact_returns;
DROP TABLE IF EXISTS fact_sales;
DROP TABLE IF EXISTS dim_product;
DROP TABLE IF EXISTS dim_product_subcategory;
DROP TABLE IF EXISTS dim_product_category;
DROP TABLE IF EXISTS dim_customer;
DROP TABLE IF EXISTS dim_territory;
DROP TABLE IF EXISTS dim_date;

CREATE TABLE dim_date (
    full_date        DATE         PRIMARY KEY,
    day_name         VARCHAR(20),
    start_of_week    DATE,
    start_of_month   DATE,
    start_of_quarter DATE,
    month_name       VARCHAR(20),
    month            INT,
    start_of_year    DATE,
    year             INT
);

CREATE TABLE dim_territory (
    territory_key INT PRIMARY KEY,
    region        VARCHAR(50),
    country       VARCHAR(50),
    continent     VARCHAR(50)
);

CREATE TABLE dim_customer (
    customer_key    INT PRIMARY KEY,
    prefix          VARCHAR(10),
    first_name      VARCHAR(50),
    last_name       VARCHAR(50),
    birth_date      DATE,
    marital_status  VARCHAR(10),
    gender          VARCHAR(1),
    email_address   VARCHAR(100),
    annual_income   DECIMAL(15,2),
    total_children  INT,
    education_level VARCHAR(50),
    occupation      VARCHAR(50),
    home_owner      VARCHAR(1),
    full_name       VARCHAR(150)
);

CREATE TABLE dim_product_category (
    product_category_key INT PRIMARY KEY,
    category_name        VARCHAR(50)
);

CREATE TABLE dim_product_subcategory (
    product_subcategory_key INT PRIMARY KEY,
    subcategory_name        VARCHAR(50),
    product_category_key    INT,
    FOREIGN KEY (product_category_key) REFERENCES dim_product_category(product_category_key)
);

CREATE TABLE dim_product (
    product_key             INT PRIMARY KEY,
    product_subcategory_key INT,
    product_sku             VARCHAR(50),
    product_name            VARCHAR(150),
    model_name              VARCHAR(150),
    product_description     TEXT,
    product_color           VARCHAR(50),
    product_style           VARCHAR(50),
    product_cost            DECIMAL(10,2),
    product_price           DECIMAL(10,2),
    sku_type                VARCHAR(50),
    FOREIGN KEY (product_subcategory_key) REFERENCES dim_product_subcategory(product_subcategory_key)
);

CREATE TABLE fact_sales (
    sales_key       INT AUTO_INCREMENT PRIMARY KEY,
    order_date      DATE,
    stock_date      DATE,
    order_number    VARCHAR(50),
    product_key     INT,
    customer_key    INT,
    territory_key   INT,
    order_line_item INT,
    order_quantity  INT,
    FOREIGN KEY (order_date)    REFERENCES dim_date(full_date),
    FOREIGN KEY (product_key)   REFERENCES dim_product(product_key),
    FOREIGN KEY (customer_key)  REFERENCES dim_customer(customer_key),
    FOREIGN KEY (territory_key) REFERENCES dim_territory(territory_key)
);

CREATE TABLE fact_returns (
    return_date     DATE,
    territory_key   INT,
    product_key     INT,
    return_quantity INT,
    FOREIGN KEY (return_date)   REFERENCES dim_date(full_date),
    FOREIGN KEY (territory_key) REFERENCES dim_territory(territory_key),
    FOREIGN KEY (product_key)   REFERENCES dim_product(product_key)
);

-- Indexes for OLAP performance
CREATE INDEX idx_fs_order_date   ON fact_sales (order_date);
CREATE INDEX idx_fs_product_key  ON fact_sales (product_key);
CREATE INDEX idx_fs_customer_key ON fact_sales (customer_key);
CREATE INDEX idx_fs_territory    ON fact_sales (territory_key);

CREATE INDEX idx_fr_return_date  ON fact_returns (return_date);
CREATE INDEX idx_fr_product_key  ON fact_returns (product_key);
CREATE INDEX idx_fr_territory    ON fact_returns (territory_key);

CREATE INDEX idx_date_year       ON dim_date (year);
CREATE INDEX idx_date_month      ON dim_date (month);
