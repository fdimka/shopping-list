import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { CatalogService } from "../src/catalog.service";
const originalFetch = global.fetch;
const item = {
  productId: 2,
  categoryId: 1,
  name: "חלב",
  categoryName: "חלב וגבינות",
  quantity: 2,
};
afterEach(() => {
  global.fetch = originalFetch;
});
test("rejects a fabricated product snapshot", async () => {
  global.fetch = async () =>
    ({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "חלב וגבינות",
          products: [{ id: 2, name: "חלב", categoryId: 1 }],
        },
      ],
    }) as any;
  await assert.rejects(
    new CatalogService().validateItems([{ ...item, name: "fake" }]),
    /Invalid catalog/,
  );
});
test("maps unavailable catalog to 503", async () => {
  global.fetch = async () => {
    throw new Error("private connection string");
  };
  await assert.rejects(
    new CatalogService().validateItems([item]),
    (error: any) => error.getStatus() === 503,
  );
});
