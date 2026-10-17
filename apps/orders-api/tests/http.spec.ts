import "reflect-metadata";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import request from "supertest";
import { OrdersController } from "../src/orders.controller";
import { CatalogService } from "../src/catalog.service";
import { Order } from "../src/order.schema";
import { configure } from "../src/configure";
let app: INestApplication;
const model = {
  findOne: () => ({ exec: async () => null }),
  create: async () => ({ _id: "saved" }),
};
before(async () => {
  const module = await Test.createTestingModule({
    controllers: [OrdersController],
    providers: [
      { provide: getModelToken(Order.name), useValue: model },
      {
        provide: CatalogService,
        useValue: { validateItems: async (items: any) => items },
      },
    ],
  }).compile();
  app = module.createNestApplication({ bodyParser: false });
  configure(app);
  await app.init();
});
after(async () => {
  await app.close();
});
test("unknown route returns safe 404 with trace ID", async () => {
  const response = await request(app.getHttpServer())
    .get("/missing")
    .expect(404);
  assert.equal(response.body.status, 404);
  assert.ok(response.body.traceId);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
});
test("HTTP DTO rejects English and unknown fields", async () => {
  await request(app.getHttpServer())
    .post("/api/orders")
    .send({ fullName: "John Smith", unexpected: 1 })
    .expect(400);
});
test("oversized body returns 413 without a stack", async () => {
  const response = await request(app.getHttpServer())
    .post("/api/orders")
    .send({ address: "א".repeat(40000) })
    .expect(413);
  assert.equal(response.body.stack, undefined);
});
test("unexpected failures return safe 500 responses", async () => {
  const previous = model.findOne;
  model.findOne = () => {
    throw new Error("private database password");
  };
  try {
    const response = await request(app.getHttpServer())
      .post("/api/orders")
      .send({
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
      })
      .expect(500);
    assert.ok(!JSON.stringify(response.body).includes("password"));
  } finally {
    model.findOne = previous;
  }
});
