# Verify the APIs and databases

Run commands from repository root with Docker Desktop running. This guide separates code tests from live checks.

## Automated code tests

```powershell
npm ci
npm test
npm run test:dotnet
```

Frontend tests cover dropdown behavior, category filtering, cart transfer, Hebrew-only input, validation, unavailable-server recovery, and successful order submission. NestJS tests cover DTO rules, product authenticity, persistence calls, safe retry behavior, 404/400/413 HTTP responses, and security headers. .NET tests query the EF relational model in SQLite memory, verify seed values/relationships, and check HTTP responses through a test host. SQLite is a test fixture only: the application runtime remains SQL Server.

## .NET API and Entity Framework connection

```powershell
Invoke-RestMethod http://localhost:5000/health/live
Invoke-RestMethod http://localhost:5000/health/ready
$catalog = Invoke-RestMethod http://localhost:5000/api/categories
$catalog | ConvertTo-Json -Depth 6
$catalog.Count
($catalog.products | Measure-Object).Count
```

Expected readiness: `status=ok`, `database=sqlserver`, and provider `Microsoft.EntityFrameworkCore.SqlServer`. Expected counts: 4 categories, 12 products. This readiness check calls EF `Database.CanConnectAsync`; the catalog endpoint uses EF `AsNoTracking` and relationship projection to query SQL.

To inspect persisted catalog rows and the MongoDB order count without placing passwords in your command:

```powershell
node scripts/inspect-databases.mjs
```

Expected: four category rows, twelve product rows, and the current order count.

EF query evidence is also visible in the catalog container's normal SQL command logs:

```powershell
docker compose logs --tail 80 catalog-api
```

Readiness proves connectivity, a successful endpoint proves the EF query works, and direct SELECT verifies the persisted records. A running container by itself does not prove those three things.

## NestJS API and MongoDB connection

```powershell
Invoke-RestMethod http://localhost:3001/health/live
Invoke-RestMethod http://localhost:3001/health/ready
```

Expected: `status=ok`, `database=mongodb`. Readiness checks the Mongoose connection and sends a real MongoDB ping.

To test checkout through HTTP, run:

```powershell
node scripts/verify.mjs
```

This script checks both readiness endpoints and the catalog, submits invalid Hebrew input expecting 400, then **writes one sample order** and retries it with the same request UUID. Expected: one order ID for both responses. Every run uses a new request UUID and therefore writes a new sample order. No orders are deleted.

To inspect one sample order returned by `verify.mjs`, replace `ORDER_ID` below:

```powershell
node scripts/inspect-databases.mjs ORDER_ID
```

The document should contain a Hebrew full name and address, email, request ID, timestamps, and the full `items` array including category/product IDs, Hebrew names, and quantities. Treat stored customer records as private; do not share screenshots containing real personal details.

## Manual UI checks

1. Open http://localhost:5173. Labels are `קטגוריה`, `מוצר`, and `כמות`, aligned right above their controls.
2. Open the category dropdown. Only four categories appear; the closed-state prompt is hidden in the open menu.
3. Select a category and open the product dropdown. Only its products appear; `שם מוצר` is hidden in the open menu.
4. Add the same product twice. Confirm merged quantities. Add another category and confirm separate grouped headings.
5. Continue to summary and attempt an empty submission. Confirm Hebrew errors.
6. Type/paste English in the name/address. Confirm the browser does not retain English letters. Hebrew names require at least two words. Address permits Hebrew, numbers, spaces, and common punctuation.
7. Submit a valid order and inspect its MongoDB document.
8. Resize the browser to a phone width. Controls stack vertically; no horizontal overflow.

## Outage and error checks

The following stops are temporary and preserve all data. Run them only during local testing.

- Missing resource: open http://localhost:5173/missing and request http://localhost:5000/missing or http://localhost:3001/missing. Expect useful frontend 404 and safe API 404 responses.
- SQL outage: `docker compose stop sqlserver`, then request catalog readiness/catalog. Expect 503 (a retry delay can occur). Restart with `docker compose start sqlserver`.
- Mongo outage: `docker compose stop mongodb`, then request orders readiness. Expect 503. Restart with `docker compose start mongodb`.
- Order API outage: `docker compose stop orders-api`, submit the form, and confirm a temporary error with the cart and fields retained. Restart with `docker compose start orders-api`, then retry.
- Unknown fields/invalid values: submit direct JSON with an extra field, an English name/address, an empty cart, or fractional quantity. Expect 400.
- Wrong product/category/name: submit a fabricated product snapshot with otherwise valid fields. Expect 400 and no saved order.
- Changed replay: resend a stored request UUID with a different address. Expect 409 and no overwritten order.

Unexpected 500 errors use generic messages. Inspect server-side logs and `X-Request-Id`; never introduce a deliberately broken production endpoint to simulate them. Unit tests verify error formatting with controlled failures.
