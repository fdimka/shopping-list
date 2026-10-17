import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest();
    const name = (error as { name?: string })?.name || "";
    const unavailable =
      /Mongo(Network|ServerSelection)|MongooseServerSelection|MongoNotConnected/.test(
        name,
      );
    const parserStatus = (error as { statusCode?: number })?.statusCode;
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : parserStatus === 413 || parserStatus === 400
          ? parserStatus
          : unavailable
            ? 503
            : 500;
    const messages: Record<number, string> = {
      400: "Invalid request",
      404: "Not found",
      405: "Method not allowed",
      409: "Order conflict",
      413: "Request too large",
      429: "Too many requests",
      500: "Internal server error",
      503: "Service unavailable",
    };
    if (status >= 500)
      this.logger.error(`Request failed: status=${status}, type=${name}, requestId=${request.traceId}`);
    response
      .status(status)
      .json({
        status,
        title: messages[status] || "Request failed",
        traceId: request.traceId,
      });
  }
}
