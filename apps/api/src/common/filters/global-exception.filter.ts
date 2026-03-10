import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : this.extractMessage(exceptionResponse) ?? 'Internal server error';

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message
    });
  }

  private extractMessage(exceptionResponse: unknown): string | undefined {
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const candidate = exceptionResponse as { message?: unknown };
      if (Array.isArray(candidate.message)) {
        return candidate.message.map((item) => String(item)).join(', ');
      }

      if (typeof candidate.message === 'string') {
        return candidate.message;
      }
    }

    return undefined;
  }
}
