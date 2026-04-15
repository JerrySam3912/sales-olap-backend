CREATE DATABASE IF NOT EXISTS adventureworks;
USE adventureworks;
DROP TABLE IF EXISTS fact_returns;
DROP TABLE IF EXISTS fact_sales;
DROP TABLE IF EXISTS dim_product;
DROP TABLE IF EXISTS dim_product_subcategory;
DROP TABLE IF EXISTS dim_product_category;
DROP TABLE IF EXISTS dim_customer;
DROP TABLE IF EXISTS dim_territory;
DROP TABLE IF EXISTS dim_calendar;


-- CALENDAR DIMENSION
CREATE TABLE dim_calendar (
    Date DATE PRIMARY KEY,
    DayName VARCHAR(20),
    StartOfWeek DATE,
    StartOfMonth DATE,
    StartOfQuarter DATE,
    MonthName VARCHAR(20),
    MonthNumber INT,
    StartOfYear DATE,
    Year INT
);

-- TERRITORY DIMENSION
CREATE TABLE dim_territory (
    SalesTerritoryKey INT PRIMARY KEY,
    Region VARCHAR(50),
    Country VARCHAR(50),
    Continent VARCHAR(50)
);

-- CUSTOMER DIMENSION
CREATE TABLE dim_customer (
    CustomerKey INT PRIMARY KEY,
    Prefix VARCHAR(10),
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    BirthDate DATE,
    MaritalStatus VARCHAR(10),
    Gender VARCHAR(1),
    EmailAddress VARCHAR(100),
    AnnualIncome DECIMAL(15,2),
    TotalChildren INT,
    EducationLevel VARCHAR(50),
    Occupation VARCHAR(50),
    HomeOwner VARCHAR(1),
    FullName VARCHAR(150)
);

-- PRODUCT CATEGORY 
CREATE TABLE dim_product_category (
    ProductCategoryKey INT PRIMARY KEY,
    CategoryName VARCHAR(50)
);

-- PRODUCT SUBCATEGORY 
CREATE TABLE dim_product_subcategory (
    ProductSubcategoryKey INT PRIMARY KEY,
    SubcategoryName VARCHAR(50),
    ProductCategoryKey INT,
    FOREIGN KEY (ProductCategoryKey) REFERENCES dim_product_category(ProductCategoryKey)
);

-- PRODUCT DIMENSION 
CREATE TABLE dim_product (
    ProductKey INT PRIMARY KEY,
    ProductSubcategoryKey INT,
    ProductSKU VARCHAR(50),
    ProductName VARCHAR(150),
    ModelName VARCHAR(150),
    ProductDescription TEXT,
    ProductColor VARCHAR(50),
    ProductStyle VARCHAR(50),
    ProductCost DECIMAL(10,2),
    ProductPrice DECIMAL(10,2),
    SKUType VARCHAR(50),
    FOREIGN KEY (ProductSubcategoryKey) REFERENCES dim_product_subcategory(ProductSubcategoryKey)
);



-- SALES FACT TABLE
CREATE TABLE fact_sales (
    OrderDate DATE,
    StockDate DATE,
    OrderNumber VARCHAR(50),
    ProductKey INT,
    CustomerKey INT,
    TerritoryKey INT,
    OrderLineItem INT,
    OrderQuantity INT,
    FOREIGN KEY (OrderDate) REFERENCES dim_calendar(Date),
    FOREIGN KEY (ProductKey) REFERENCES dim_product(ProductKey),
    FOREIGN KEY (CustomerKey) REFERENCES dim_customer(CustomerKey),
    FOREIGN KEY (TerritoryKey) REFERENCES dim_territory(TerritoryKey)
);

-- RETURNS FACT TABLE
CREATE TABLE fact_return (
    ReturnDate DATE,
    TerritoryKey INT,
    ProductKey INT,
    ReturnQuantity INT,
    FOREIGN KEY (ReturnDate) REFERENCES dim_calendar(Date),
    FOREIGN KEY (TerritoryKey) REFERENCES dim_territory(TerritoryKey),
    FOREIGN KEY (ProductKey) REFERENCES dim_product(ProductKey)
);