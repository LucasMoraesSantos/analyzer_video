import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

@Injectable()
export class StructuredLoggerService extends ConsoleLogger {
  constructor() {
    super();
    this.setLogLevels(['log', 'error', 'warn', 'debug', 'verbose']);
  }

  override log(message: unknown, context?: string): void {
    super.log(this.toStructuredPayload('info', message, context));
  }

  override error(message: unknown, trace?: string, context?: string): void {
    super.error(this.toStructuredPayload('error', message, context), trace);
  }

  override warn(message: unknown, context?: string): void {
    super.warn(this.toStructuredPayload('warn', message, context));
  }

  override debug(message: unknown, context?: string): void {
    super.debug(this.toStructuredPayload('debug', message, context));
  }

  override verbose(message: unknown, context?: string): void {
    super.verbose(this.toStructuredPayload('verbose', message, context));
  }

  private toStructuredPayload(level: LogLevel, message: unknown, context?: string): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: context ?? this.context,
      message: this.formatMessage(message)
    });
  }

  private formatMessage(message: unknown): unknown {
    if (message instanceof Error) {
      return {
        name: message.name,
        message: message.message,
        stack: message.stack
      };
    }

    return message;
  }
}
