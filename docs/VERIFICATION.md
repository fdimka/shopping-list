# Verification

| Check | Result |
| --- | --- |
| React TypeScript and Vite production build | Passed |
| NestJS TypeScript production build | Passed |
| .NET 10 Release build and publish | Passed |
| Frontend tests | 12 passed |
| NestJS tests | 14 passed |
| .NET tests | 4 passed |
| npm dependency audit | Zero known vulnerabilities reported at verification time |
| NuGet vulnerable-package check, including transitive dependencies | No vulnerable packages reported for API and test projects |
| Compose YAML parsing | Passed |
| Setup script generates credentials and preserves existing values | Passed |
| Docker full stack with SQL Server and authenticated MongoDB | Not run here: Docker is unavailable |
| Existing-volume MongoDB migration | Reviewed and included; not run against a live database here |
| Visual browser inspection | Not completed here; component behavior tested through the DOM |

The .NET relational tests use SQLite memory to test the EF model, seeded records, and relationship queries. The runtime provider is SQL Server. NestJS unit/HTTP tests substitute the persistence model and catalog dependency; the Mongo readiness unit test substitutes the connection. These tests do not prove live database persistence.

Run `node scripts/verify.mjs` and `node scripts/inspect-databases.mjs ORDER_ID` on the installed stack to verify real SQL EF connectivity, real Mongo connectivity, and the saved order document. The verify script deliberately writes one sample order per run. Follow docs/UPGRADE.md before replacing an existing unauthenticated Mongo installation.
