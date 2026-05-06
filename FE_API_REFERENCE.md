# FE API Reference

Tai lieu tong hop cac API hien tai frontend co the su dung trong du an `sales-olap-backend`.

## Base URL

- Local: `http://localhost:5000/api/v1`

## Response format

Backend tra ve dang:

```json
{
  "success": true,
  "data": {}
}
```

Hoac loi:

```json
{
  "success": false,
  "message": "..."
}
```

## Health

- `GET /health`

## Analytics APIs

- `GET /analytics/overview`
- `GET /analytics/sales-by-year`
- `GET /analytics/sales-by-month?year=2013`
- `GET /analytics/top-products?limit=10`
- `GET /analytics/sales-by-country`
- `GET /analytics/sales-by-category?year=2013&country=United%20States&month=7&date=2013-07-01`
- `GET /analytics/executive-kpis?year=2013&month=7&date=2013-07-01`
- `GET /analytics/revenue-trending?layer=year`
- `GET /analytics/revenue-trending?layer=month&year=2013`
- `GET /analytics/revenue-trending?layer=day&year=2013&month=7`
- `GET /analytics/country-stats?year=2013&month=7&date=2013-07-01&limit=10&sortBy=Revenue`
- `GET /analytics/returns-by-product?limit=10`
- `GET /analytics/return-rate?limit=10`
- `GET /analytics/sales-detail?year=2013&country=United%20States&category=Bikes&page=1&limit=10`

## Newly added analytics APIs

- `GET /analytics/customer-kpis`
- `GET /analytics/orders-by-gender`
- `GET /analytics/orders-by-occupation`
- `GET /analytics/orders-by-income-level`
- `GET /analytics/top-products-by-orders?limit=10`
- `GET /analytics/profit-trending?productKey=214`

## Query param validation notes

- `year`: so nguyen trong khoang `1900..9999`
- `month`: so nguyen trong khoang `1..12`
- `date`: dung dinh dang `YYYY-MM-DD`
- `limit`: so nguyen duong
- `page`: so nguyen duong
- `layer`: `year | month | day`
- `sortBy`: `Orders | Revenue | ReturnRate`
- `productKey`: so nguyen duong

## Notes for FE team

- FE khong can viet SQL/query DB, chi goi API va doc JSON response.
- Nen thong nhat dung camelCase cho key phia client.
- Endpoint `country-stats` hien dang uu tien `sortBy` (camelCase).
