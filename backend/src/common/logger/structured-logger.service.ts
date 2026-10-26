import { Injectable, LoggerService } from '@nestjs/common';

export interface LogPayload {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
  traceId?: string;
  timestamp: string;
  [key: string]: unknown;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private formatLog(
    level: LogPayload['level'],
    message: unknown,
    context?: string,
    metadata?: Record<string, unknown>,
  ): string {
    const logObject: LogPayload = {
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: context || 'Application',
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    return JSON.stringify(logObject);
  }

  log(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    process.stdout.write(this.formatLog('info', message, context, metadata) + '\n');
  }

  error(message: unknown, trace?: string, context?: string, metadata?: Record<string, unknown>) {
    const errorMeta = {
      ...metadata,
      ...(trace ? { stack: trace } : {}),
    };
    process.stderr.write(this.formatLog('error', message, context, errorMeta) + '\n');
  }

  warn(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    process.stdout.write(this.formatLog('warn', message, context, metadata) + '\n');
  }

  debug(message: unknown, context?: string, metadata?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(this.formatLog('debug', message, context, metadata) + '\n');
    }
  }
}
