import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response as ExpressResponse } from "express";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    }

    // Log error for monitoring
    console.error(`[Error] ${request.method} ${request.url}:`, exception);

    response.status(status).json({
      status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
