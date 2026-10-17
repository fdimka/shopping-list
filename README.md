# Hebrew shopping list

A two-page React and Redux Toolkit application with two separate APIs: .NET 10 and Entity Framework Core read the catalog from SQL Server; NestJS validates and stores orders in MongoDB. The interface is Hebrew and RTL.

## 1. Install the prerequisites

The simplest way to review this solution is to run every component with Docker Compose. You do not need to install SQL Server, MongoDB, the .NET SDK or NestJS separately for this route. Docker builds the APIs and frontend and starts both databases.

| Tool | Required for | Installation |
| --- | --- | --- |
| Docker Desktop with Docker Compose v2 | Building and running the complete solution | [Windows installation](https://docs.docker.com/desktop/setup/install/windows-install/) |
| Node.js 22.12 or newer, including npm | Generating local configuration, verification scripts and optional JavaScript tests | [Node.js downloads](https://nodejs.org/en/download/) |
| Git | Cloning and updating the source; optional if downloading ZIP | [Git downloads](https://git-scm.com/downloads) |
| A modern browser | Opening the Hebrew application | Edge, Chrome or Firefox |
| .NET 10 SDK | Optional: running or testing .NET outside Docker | [Microsoft .NET downloads](https://dotnet.microsoft.com/download/dotnet/10.0) |

Use an Intel/AMD x64 machine for the supplied SQL Server Linux container. ARM / Apple Silicon is not a supported target for this configuration. Use Docker Desktop's Linux containers; on Windows, follow Docker's WSL 2 setup instructions and restart Windows if the installer requests it. Start Docker Desktop and wait until its engine is running. Allow sufficient memory for both databases and image builds; 8 GB available to Docker is a useful starting point, rather than a guaranteed minimum. The first build requires internet access to download images and packages.

Open Windows PowerShell and check:

```powershell
node --version
npm --version
docker --version
docker compose version
docker info
```

`node --version` must satisfy the version above. `docker info` must connect to the running engine. Git users should also run `git --version`. Reopen PowerShell after installing tools so that PATH changes take effect. If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm` for the commands below; changing execution policy is unnecessary.

## 2. Download the source

### Option A: clone with Git

Copy the HTTPS clone URL from the repository's **Code** menu. Replace `YOUR_REPOSITORY_URL` below with that URL; it is a placeholder, not a working address.

```powershell
git clone YOUR_REPOSITORY_URL shopping-list
Set-Location shopping-list
```

For a private repository, the owner must grant you access. Authenticate through your Git host's normal sign-in flow.

### Option B: download ZIP

On the repository page, choose **Code > Download ZIP**, extract it completely, and open PowerShell in the extracted project folder. Do not run commands from inside the ZIP preview. The correct folder contains `compose.yaml`, `package.json`, `package-lock.json`, `apps`, and `scripts`. The extracted folder name may end in `-main`; that is fine.

All remaining commands run from this project root. On macOS/Linux x64, use a terminal and replace PowerShell's `Set-Location` with `cd`.

## 3. Configure and start the application

```powershell
node scripts/setup.mjs
docker compose config --quiet
docker compose up -d --build
docker compose ps -a
```

The setup script generates unique local credentials in the ignored root `.env` file. It preserves existing values. Each tester has independent local database volumes and credentials; no cloud account or credentials from the author are needed. Do not commit or share `.env`. Keep it while retaining the database volumes: generating new passwords against existing volumes causes authentication failures.

The first build and SQL initialization may take several minutes, depending on your connection and computer. `docker compose up` completing means containers have started; wait for application readiness before testing. Expected status:

| Service | Expected state |
| --- | --- |
| sqlserver, mongodb | Running and healthy |
| catalog-init | Exited (0): successful one-time initialization |
| catalog-api, orders-api, web | Running |

Open **http://localhost:5173**. No `npm install`, `npm run dev:web`, separate database install or manual SQL import is needed to run this Docker route. Do not launch another frontend on port 5173.

**Existing installations upgrading an earlier package:** read [UPGRADE.md](docs/UPGRADE.md) before replacing the files. These new-install instructions do not migrate an existing unauthenticated MongoDB volume.

## 4. Confirm that it works

Run the readiness checks in PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/health/ready
Invoke-RestMethod http://localhost:3001/health/ready
node scripts/verify.mjs
```

The first response should report `ok`, `sqlserver`, and `Microsoft.EntityFrameworkCore.SqlServer`. The second should report `ok` and `mongodb`. If either is still starting, wait briefly and retry. The final script checks real database readiness, 4 categories and 12 products, invalid-input rejection, successful order creation, and retrying the same order request. It writes one sample order and prints its ID. It exits unsuccessfully if an assertion fails.

For a manual walkthrough:

1. Open the shopping list and select a category, product and quantity.
2. Click **הוסף מוצר לסל**. Add another product or add the same one to check quantity merging.
3. Click **המשך להזמנה**. Confirm that all selected products appear.
4. Enter a Hebrew first and last name (for example `ישראל ישראלי`), a Hebrew address (for example `הרצל 10 תל אביב`), and an email (for example `test@example.com`).
5. Click **אשר הזמנה** and check for the successful order confirmation.

Use sample information when testing. Cart state is held in browser memory and resets on refresh. Submitted orders are saved in MongoDB. To inspect the document returned by the verification script, replace `ORDER_ID` with its printed value:

```powershell
node scripts/inspect-databases.mjs ORDER_ID
```

Read [TESTING.md](docs/TESTING.md) for schema, data, API and failure-case checks.

## Components

| Component | Source | Local direct API |
| --- | --- | --- |
| React + Redux Toolkit | apps/web | Frontend: http://localhost:5173 |
| .NET 10 + EF Core 10 | apps/catalog-api | http://localhost:5000 |
| NestJS + Mongoose | apps/orders-api | http://localhost:3001 |
| SQL Server | Docker volume sql_data | 127.0.0.1:1433 |
| MongoDB | Docker volume mongo_data | 127.0.0.1:27017 |

The container frontend uses same-origin `/catalog` and `/orders` proxy paths. Its product data still comes from the .NET SQL API. The direct URLs remain available for verification.

The catalog has four categories and twelve products with the exact supplied Hebrew spelling. Repeated additions merge quantities. The order form validates a Hebrew first and last name, a Hebrew address with numbers and ordinary punctuation, and an email address. Selected products remain in Redux until the server confirms persistence. A stable request UUID prevents duplicate orders after retries.

## Automated tests

```powershell
npm ci
npm test
npm run build
npm run test:dotnet
```

`npm test` runs frontend and NestJS tests. `npm run test:dotnet` runs the .NET test project inside Docker. If .NET 10 SDK is installed, this also works:

```powershell
dotnet test apps/catalog-api/tests/Catalog.Api.Tests.csproj -c Release
```

Test folders:

- `apps/web/tests`: cart, HTTP messages, Hebrew validation, dropdowns, page navigation and order submission.
- `apps/catalog-api/tests`: EF catalog relationships and seeding, HTTP error responses and liveness.
- `apps/orders-api/tests`: DTO validation, catalog authenticity, retries, persistence calls and HTTP behavior.

Read [TESTING.md](docs/TESTING.md) to verify live API and database behavior. Unit tests substitute dependencies; they do not establish that your installed SQL Server and MongoDB are connected. The live verification script checks those connections and writes a sample order.

## Frontend development

For React hot reload, stop only the container frontend:

```powershell
docker compose stop web
npm ci
npm run dev:web
```

The development frontend defaults to the direct API URLs above. An optional `apps/web/.env.local` can override them using `apps/web/.env.example`. Use **localhost** for the browser address to match CORS. Keep the terminal open. Press Ctrl+C to stop Vite before restarting the container frontend.

## Run APIs directly

Install .NET 10 SDK and Node.js. Start the databases and seed the SQL catalog:

```powershell
docker compose up -d sqlserver mongodb
docker compose run --rm catalog-init
docker compose stop catalog-api orders-api web
npm ci
```

For the .NET API, in its own terminal, load your generated SQL application password from root `.env` without printing it:

```powershell
$sqlLine = Get-Content .env | Where-Object { $_ -match '^SQL_APP_PASSWORD=' }
$sqlPassword = $sqlLine.Substring('SQL_APP_PASSWORD='.Length)
$env:ConnectionStrings__Catalog = "Server=localhost,1433;Database=ShoppingCatalog;User Id=shopping_catalog;Password=$sqlPassword;TrustServerCertificate=True"
$env:FrontendOrigin = 'http://localhost:5173'
dotnet run --project apps/catalog-api/Catalog.Api.csproj --urls http://localhost:5000
```

For NestJS, copy `apps/orders-api/.env.example` to `apps/orders-api/.env` and fill the Mongo application username/password generated in root `.env`. Use `authSource=shopping_orders`. Then, from repository root in another terminal:

```powershell
npm run dev:orders
```

Start the frontend in a third terminal with `npm run dev:web`. After source changes to the directly running NestJS API, restart it. Do not run container and host APIs on the same ports simultaneously.

## Configuration

| Variable | Used by | Purpose |
| --- | --- | --- |
| SQL_SA_PASSWORD | SQL and catalog initializer | Administrative bootstrap only |
| SQL_APP_PASSWORD | Catalog API | Read-only catalog login |
| MONGO_ROOT_USERNAME / MONGO_ROOT_PASSWORD | MongoDB | Administration and readiness check |
| MONGO_APP_USERNAME / MONGO_APP_PASSWORD | Orders API | Read/write only in shopping_orders |
| ConnectionStrings__Catalog | .NET | SQL Server connection string |
| MONGODB_URI | NestJS | MongoDB connection URI |
| CATALOG_API_URL | NestJS | Internal .NET URL for catalog validation |
| FRONTEND_ORIGIN / FrontendOrigin | APIs | Allowed browser origin |
| VITE_CATALOG_API_URL / VITE_ORDERS_API_URL | React build | Public endpoint prefixes; never secrets |

Credentials are never placed in frontend build variables. For separately hosted databases, set server environment variables or a secret store. Do not send database passwords or tokens in chat.

## Security and behavior

- Hebrew restrictions are enforced on both client and server. The browser rejects non-Hebrew characters on input; the API rejects bypass attempts. Address numbers and punctuation are permitted, but at least one Hebrew letter is required. The form does not verify a postal address against an external registry.
- EF performs parameterized queries. The running catalog API uses a read-only SQL login. The separate initializer needs administrative access to create the dedicated database, seed it, and grant table-level SELECT access.
- MongoDB authentication is enabled. The orders API uses a database-scoped user rather than the root account. Requests cannot supply MongoDB query operators or unknown DTO fields.
- The order API verifies product IDs, categories, and names against the SQL catalog before saving canonical snapshots. Catalog outages reject new orders with 503. Already stored retries can return their existing ID without a new catalog lookup.
- API requests have size limits and rate limits. Security headers, restricted CORS, request IDs, and safe error responses are included. Error responses do not return stack traces, credentials, or raw database exceptions.
- Database and API ports bind to loopback. API containers run as unprivileged users. Container runtime images exclude test tools.
- This assignment has anonymous checkout; no user accounts or authorization system are specified. Rate limiting is per process, and order data retention has no automatic cleanup. Keep the app private for testing. A public production deployment needs HTTPS, authentication where appropriate, backups, retention rules, infrastructure monitoring and a deployment-specific review.

The local setup uses HTTP on localhost and trusts SQL Server's local self-signed certificate. For remote SQL Server use a trusted certificate with `TrustServerCertificate=False`. For remote MongoDB require TLS (for example a `mongodb+srv` Atlas URI). Terminate public HTTPS at a reverse proxy with a valid certificate and update browser origins/endpoints consistently; the application does not silently disable certificate checks to resolve HTTPS failures.

## Error handling

| Status | Meaning and behavior |
| --- | --- |
| 400 | Invalid input or fabricated catalog product; form remains editable |
| 404 | API resource or frontend route missing; useful error/return link |
| 409 | Same order request ID used with different saved details; no overwrite |
| 413 | Request exceeds body-size limit |
| 429 | Rate limit exceeded; wait before retrying |
| 500 | Unexpected server error; generic response and server-side request diagnostics |
| 502 / 504 | Proxy/upstream failure; frontend explains temporary failure |
| 503 | Database or catalog unavailable; cart/form retained |
| Network / timeout | Request bounded to 15 seconds; frontend retains data |

An order is cleared from the cart only after a successful server response. Cart state is in Redux memory and resets on browser refresh. Schema creation uses EF `EnsureCreated` for this dedicated test database; future schema evolution should use migrations. Existing database credentials are not rotated automatically.

## Stop and restart

```powershell
docker compose down
```

This preserves database volumes. Never add `-v` unless you intentionally want to erase all catalog/order data. To restart:

```powershell
docker compose up -d
```

## Troubleshooting

```powershell
docker compose logs --tail 80 catalog-init catalog-api orders-api
docker compose logs --tail 80 sqlserver mongodb
```

Do not share unredacted `.env` or configuration output: `docker compose config` without `--quiet` expands credentials. If readiness fails, check the corresponding container logs and retained `.env` values. If Mongo authentication fails after upgrading, follow UPGRADE.md; initialization scripts run only on a new Mongo volume. If a port is occupied, stop the conflicting local service or old containers. This stack uses 5173, 5000, 3001, 1433 and 27017. In PowerShell, `Get-NetTCPConnection -State Listen -LocalPort 5173` can identify a listener; inspect its owning process before stopping anything. Changing ports requires updating the corresponding endpoint and browser-origin configuration.

| Symptom | What to check |
| --- | --- |
| Docker daemon / named-pipe connection error | Start Docker Desktop, wait for the engine, then run `docker info` |
| Virtualization / WSL error | Follow Docker's official Windows prerequisites and restart if needed |
| Missing environment variable | Run `node scripts/setup.mjs` from the folder containing `compose.yaml` |
| First startup is slow | Check `docker compose ps -a` and initializer/database logs; image downloads and SQL startup take time |
| Browser cannot connect / 502 / 503 | Check API readiness URLs and service logs, then retry after services are ready |
| Authentication fails with retained databases | Restore the original local `.env`; read UPGRADE.md for older Mongo volumes |
| Out of memory / container exits | Check Docker resources and logs, free memory and restart the affected service |
| Browser shows old code after source update | Run `docker compose up -d --build`, then reload the browser |

To stop the app safely, run `docker compose down` from its project root, then quit Docker Desktop if desired. Do not use `down -v` for a normal shutdown; that deletes database volumes.

## Repository handoff and documentation

After final approval, use one Git repository for every component. See [GIT.md](docs/GIT.md) for safe commit/push instructions and `SUBMISSION.md` for the one-link submission template. The owner creates and pushes the remote repository using that guide. The repository URL can then be shared with testers. The configuration examples intentionally contain no real credentials.
