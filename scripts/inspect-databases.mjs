import { spawnSync } from "node:child_process";
const id = process.argv[2];
if (id && !/^[a-f0-9]{24}$/i.test(id))
  throw new Error("Order ID must be a 24-character MongoDB ObjectId");
function inspect(service, script) {
  const result = spawnSync(
    "docker",
    ["compose", "exec", "-T", service, "sh", "-s"],
    { input: script, encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(
      `Database check failed for ${service}. Inspect container logs without sharing credentials.`,
    );
    process.exit(1);
  }
  console.log(result.stdout);
}
inspect(
  "sqlserver",
  `/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d ShoppingCatalog -Q "SELECT Id, Name FROM dbo.Categories; SELECT Id, Name, CategoryId FROM dbo.Products;" -b\n`,
);
const query = id
  ? `db.orders.findOne({_id:ObjectId("${id}")})`
  : "db.orders.countDocuments({})";
inspect(
  "mongodb",
  `mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin shopping_orders --eval '${query}'\n`,
);
