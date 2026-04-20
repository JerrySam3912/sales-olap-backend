# Sales OLAP Backend

Backend REST API for dashboard and analytics consumption on top of the existing MySQL data warehouse `adventureworks`.

## Tech Stack

- Node.js
- Express
- MySQL with `mysql2/promise`
- dotenv
- cors
- morgan
- helmet
- ES Modules

## Project Structure

```text
backend/
  src/
    app.js
    server.js
    config/
      db.js
    routes/
      index.js
      analytics.routes.js
    controllers/
      analytics.controller.js
    services/
      analytics.service.js
    queries/
      analytics.query.js
    utils/
      response.js
  .env.example
  package.json
```

## Layered Architecture

- `routes`: define endpoint URLs and map requests to controllers
- `controllers`: receive request params and return standardized JSON responses
- `services`: contain business logic such as limit parsing and pagination
- `queries`: contain raw SQL and direct database access
- `config`: initialize the MySQL pool
- `utils`: reusable response and pagination helpers

## Environment Variables

Create a `.env` file from `.env.example`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=adventureworks
DB_CONNECTION_LIMIT=10
```

## Installation

```bash
cd backend
npm install
```

## Run The API

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Base URL:

```text
http://localhost:5000/api/v1
```

## Endpoints

### Health

`GET /health`

Response:

```json
{
  "success": true,
  "message": "API is running"
}
```

### Overview KPIs

`GET /analytics/overview`

Returns:

- `total_orders`
- `total_quantity_sold`
- `total_return_quantity`
- `total_products`
- `total_customers`
- `total_countries`

### Sales By Year

`GET /analytics/sales-by-year`

### Sales By Month

`GET /analytics/sales-by-month`

Optional query params:

- `year`

Example:

```text
GET /analytics/sales-by-month?year=2022
```

### Top Products

`GET /analytics/top-products`

Optional query params:

- `limit` default `10`

### Sales By Country

`GET /analytics/sales-by-country`

### Sales By Category

`GET /analytics/sales-by-category`

Optional query params:

- `year`
- `country`
- `subcategory`

### Returns By Month

`GET /analytics/returns-by-month`

Optional query params:

- `year`

### Returns By Product

`GET /analytics/returns-by-product`

Optional query params:

- `limit` default `10`

### Return Rate

`GET /analytics/return-rate`

Optional query params:

- `limit` default `10`

### Sales Detail

`GET /analytics/sales-detail`

Optional query params:

- `year`
- `country`
- `category`
- `page` default `1`
- `limit` default `10`

Example:

```text
GET /analytics/sales-detail?year=2022&country=United%20States&category=Bikes&page=1&limit=10
```

## Response Format

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Message response:

```json
{
  "success": true,
  "message": "API is running"
}
```

Error response:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Validation error response:

```json
{
  "success": false,
  "message": "Query parameter \"limit\" must be a positive integer."
}
```

## Query Validation

The API validates common analytics query params before they reach the controller:

- `year` must be a valid year
- `page` must be a positive integer
- `limit` must be a positive integer
- `country` must be a non-empty string when provided
- `category` must be a non-empty string when provided

## Pagination

The reusable pagination helper lives in `src/utils/response.js`.

Example paginated response from `sales-detail`:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_records": 0,
      "total_pages": 0
    }
  }
}
```

## Quick Test URLs

- `http://localhost:5000/api/v1/health`
- `http://localhost:5000/api/v1/analytics/overview`
- `http://localhost:5000/api/v1/analytics/sales-by-year`
- `http://localhost:5000/api/v1/analytics/top-products?limit=5`
- `http://localhost:5000/api/v1/analytics/sales-detail?page=1&limit=5`
- `http://localhost:5000/api/v1/analytics/returns-by-month?year=2022`
- `http://localhost:5000/api/v1/analytics/sales-by-category?year=2022&subcategory=Road%20Bikes`
