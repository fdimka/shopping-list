import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const catalogUrl = process.env.CATALOG_API_URL || "http://localhost:5000";
const ordersUrl = process.env.ORDERS_API_URL || "http://localhost:3001";
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `GET ${url}`);
  return response.json();
}
const sql = await get(`${catalogUrl}/health/ready`);
assert.equal(sql.provider, "Microsoft.EntityFrameworkCore.SqlServer");
const mongo = await get(`${ordersUrl}/health/ready`);
assert.equal(mongo.database, "mongodb");
const categories = await get(`${catalogUrl}/api/categories`);
assert.equal(categories.length, 4);
assert.equal(
  categories.reduce((n, c) => n + c.products.length, 0),
  12,
);
const category = categories[0],
  product = category.products[0];
const payload = {
  requestId: randomUUID(),
  fullName: "ישראל ישראלי",
  address: "הרצל 10 תל אביב",
  email: "test@example.com",
  items: [
    {
      productId: product.id,
      categoryId: category.id,
      name: product.name,
      categoryName: category.name,
      quantity: 2,
    },
  ],
};
async function post(data) {
  return fetch(`${ordersUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(20000),
  });
}
assert.equal((await post({ ...payload, fullName: "John Smith" })).status, 400);
const response = await post(payload);
assert.equal(response.status, 201);
const saved = await response.json();
const retry = await post(payload);
assert.equal(retry.status, 201);
assert.equal((await retry.json()).id, saved.id);
console.log(
  "SQL EF connection, catalog counts, Mongo readiness, HTTP validation and retry checks passed.",
);
console.log(
  `Sample order saved: ${saved.id}. Inspect it using docs/TESTING.md.`,
);
