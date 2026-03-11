import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

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
        : this.extractMessage(exceptionResponse) ?? this.getFriendlyMessage(status);

    this.logger.error(
      JSON.stringify({
        event: 'http_exception_handled',
        method: request.method,
        path: request.url,
        status,
        message,
        error: exception instanceof Error ? exception.message : String(exception)
      })
    );

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

  private getFriendlyMessage(status: number): string {
    if (status >= 500) {
      return 'Erro interno temporário. Tente novamente em instantes.';
    }

    return 'Não foi possível processar sua solicitação.';
  }
}
