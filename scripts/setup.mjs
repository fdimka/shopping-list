import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
const path = ".env";
const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
const passwords = [
  "SQL_SA_PASSWORD",
  "SQL_APP_PASSWORD",
  "MONGO_ROOT_PASSWORD",
  "MONGO_APP_PASSWORD",
];
let result = existing;
for (const key of passwords) {
  if (!new RegExp(`^${key}=.+$`, "m").test(result))
    result += `\n${key}=Dev_${randomBytes(24).toString("hex")}!\n`;
}
if (!/^MONGO_ROOT_USERNAME=.+$/m.test(result))
  result += "\nMONGO_ROOT_USERNAME=shopping_admin\n";
if (!/^MONGO_APP_USERNAME=.+$/m.test(result))
  result += "MONGO_APP_USERNAME=shopping_orders\n";
writeFileSync(path, result.trim() + "\n", { mode: 0o600 });
console.log(
  "Local credentials prepared in .env. Existing values preserved. Do not commit this file.",
);
