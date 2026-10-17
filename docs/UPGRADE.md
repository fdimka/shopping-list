# Upgrade the previous local package without deleting data

Your existing installation is `C:Wookieshopping-list`. The earlier MongoDB volume has no database users. The new version enables authentication, so prepare users while the old configuration is still running. Do not delete volumes.

1. Extract the updated ZIP to a separate directory, for example `C:Wookieshopping-update`. Locate its `shopping-list` subfolder. Stop the old Vite terminal with Ctrl+C.
2. Copy only the new `scripts` directory into the existing project first. Keep the old `compose.yaml` at this stage. In PowerShell:

```powershell
Set-Location C:Wookieshopping-list
docker compose up -d mongodb
node scripts/setup.mjs
node scripts/migrate-mongo.mjs
```

The script adds missing passwords to your existing `.env`, preserving the original SQL SA password. The migration creates the Mongo admin and application users without changing any order documents. Expected message: `Database users prepared. Existing orders preserved.`

3. Only after migration succeeds, stop the old stack:

```powershell
docker compose down
```

4. Copy the updated source files into the existing project, replacing matching files. Keep your root `.env`. The package has no real `.env` file to overwrite it. Remove the old `apps/web/src/store.test.ts` and `apps/orders-api/src/order.spec.ts` if they remain; tests have moved into per-component `tests` folders. Do not copy dependency or build folders.
5. Install and start:

```powershell
npm ci
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Open **http://localhost:5173**. The new container frontend runs automatically. The new `catalog-init` task creates the read-only SQL login and uses the existing seeded catalog. Existing orders remain in the Mongo volume.

If the migration fails, keep the old compose file and send only the error message or redacted logs. Do not run `docker compose down -v`. Do not regenerate passwords or delete `.env` to troubleshoot an existing volume. The migration script is meant for the previous unauthenticated version, not for rotating an already authenticated installation.
