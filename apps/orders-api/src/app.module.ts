import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { OrdersController } from "./orders.controller";
import { Order, OrderSchema } from "./order.schema";
import { CatalogService } from "./catalog.service";
import { HealthController } from "./health.controller";
@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ["apps/orders-api/.env", ".env"] }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        if (!process.env.MONGODB_URI)
          throw new Error("MONGODB_URI is required");
        return {
          uri: process.env.MONGODB_URI,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 10000,
          bufferCommands: false,
        };
      },
    }),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [OrdersController, HealthController],
  providers: [CatalogService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
