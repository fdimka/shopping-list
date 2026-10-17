import { INestApplication, ValidationPipe } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import helmet from "helmet";
import { json } from "express";
import { HttpErrorFilter } from "./http-error.filter";
export function configure(app: INestApplication) {
  app.use(helmet());
  app.use((req: any, res: any, next: () => void) => {
    req.traceId = randomUUID();
    res.setHeader("X-Request-Id", req.traceId);
    next();
  });
  app.use(json({ limit: "32kb" }));
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());
}
