import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateOrderDto } from "../src/order.dto";
import { OrdersController } from "../src/orders.controller";
const payload = {
  requestId: "0636d98e-cdab-460b-9c59-74b50bfb4f46",
  fullName: "ישראל ישראלי",
  address: "הרצל 10 תל אביב",
  email: "test@example.com",
  items: [
    {
      productId: 2,
      categoryId: 1,
      name: "חלב",
      categoryName: "חלב וגבינות",
      quantity: 2,
    },
  ],
};
const query = (value: any) => ({ exec: async () => value });
test("validates Hebrew names, addresses, email and nested quantities", async () => {
  assert.equal(
    (await validate(plainToInstance(CreateOrderDto, payload))).length,
    0,
  );
  for (const changed of [
    { fullName: "John Smith" },
    { fullName: "ישראל" },
    { address: "Herzl 10" },
    { address: "12345" },
    { email: "bad" },
    { items: [] },
    { items: [{ ...payload.items[0], quantity: 1.5 }] },
  ])
    assert.ok(
      (
        await validate(
          plainToInstance(CreateOrderDto, { ...payload, ...changed }),
        )
      ).length > 0,
    );
});
test("validates the catalog and persists customer plus all items", async () => {
  let saved: any;
  const model = {
    create: async (data: any) => {
      saved = data;
      return { _id: "saved" };
    },
    findOne: () => query(null),
  };
  const catalog = { validateItems: async () => payload.items };
  assert.deepEqual(
    await new OrdersController(model as any, catalog as any).create(payload),
    { id: "saved" },
  );
  assert.deepEqual(saved, payload);
});
test("replays same request without duplicate insertion or catalog lookup", async () => {
  const controller = new OrdersController(
    { findOne: () => query({ ...payload, _id: "saved" }) } as any,
    {} as any,
  );
  assert.deepEqual(await controller.create(payload), { id: "saved" });
});
test("rejects changed payload with an existing request ID", async () => {
  const controller = new OrdersController(
    { findOne: () => query({ ...payload, _id: "saved" }) } as any,
    {} as any,
  );
  await assert.rejects(
    controller.create({ ...payload, address: "הרצל 20 תל אביב" }),
    /different details/,
  );
});
test("rejects duplicate product rows", async () => {
  await assert.rejects(
    new OrdersController({} as any, {} as any).create({
      ...payload,
      items: [...payload.items, ...payload.items],
    }),
    /Duplicate products/,
  );
});
test("deduplicates concurrent inserts after unique index conflict", async () => {
  let queryCount = 0;
  const model = {
    findOne: () =>
      query(++queryCount === 1 ? null : { ...payload, _id: "saved" }),
    create: async () => {
      throw { code: 11000 };
    },
  };
  const controller = new OrdersController(
    model as any,
    { validateItems: async () => payload.items } as any,
  );
  assert.deepEqual(await controller.create(payload), { id: "saved" });
});
