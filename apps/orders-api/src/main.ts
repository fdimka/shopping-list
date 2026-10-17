import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "./app.module";
import { Order } from "./order.schema";
import { configure } from "./configure";
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configure(app);
  await app.get<Model<Order>>(getModelToken(Order.name)).init();
  await app.listen(Number(process.env.PORT || 3001), "0.0.0.0");
  app.enableShutdownHooks();
}
bootstrap().catch(() => {
  console.error(
    "Orders API startup failed. Check database configuration and connectivity.",
  );
  process.exit(1);
});
