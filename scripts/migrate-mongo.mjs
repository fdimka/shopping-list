// Run once against the old, running, unauthenticated MongoDB container before replacing compose.yaml.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^['"]|['"]$/g, "")];
    }),
);
for (const key of [
  "MONGO_ROOT_USERNAME",
  "MONGO_ROOT_PASSWORD",
  "MONGO_APP_USERNAME",
  "MONGO_APP_PASSWORD",
])
  if (!env[key]) throw new Error(`Missing ${key}; run setup first`);
const script = `const admin=db.getSiblingDB('admin');if(!admin.getUser(${JSON.stringify(env.MONGO_ROOT_USERNAME)}))admin.createUser({user:${JSON.stringify(env.MONGO_ROOT_USERNAME)},pwd:${JSON.stringify(env.MONGO_ROOT_PASSWORD)},roles:[{role:'root',db:'admin'}]});const orders=db.getSiblingDB('shopping_orders');if(!orders.getUser(${JSON.stringify(env.MONGO_APP_USERNAME)}))orders.createUser({user:${JSON.stringify(env.MONGO_APP_USERNAME)},pwd:${JSON.stringify(env.MONGO_APP_PASSWORD)},roles:[{role:'readWrite',db:'shopping_orders'}]});print('Database users prepared; existing orders preserved.');`;
const result = spawnSync(
  "docker",
  ["compose", "exec", "-T", "mongodb", "mongosh", "--quiet"],
  { input: script, encoding: "utf8" },
);
if (result.status !== 0) {
  console.error(
    "Migration failed. Keep the old configuration and inspect MongoDB logs.",
  );
  process.exit(1);
}
console.log(
  "Database users prepared. Existing orders preserved. You may now replace compose.yaml.",
);
