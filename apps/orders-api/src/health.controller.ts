import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { SkipThrottle } from "@nestjs/throttler";
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  @Get("live") live() {
    return { status: "ok" };
  }
  @Get("ready") async ready() {
    try {
      if (this.connection.readyState !== 1 || !this.connection.db)
        throw new Error();
      await this.connection.db.admin().ping();
      return { status: "ok", database: "mongodb" };
    } catch {
      throw new ServiceUnavailableException();
    }
  }
}
