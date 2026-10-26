import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { StructuredLoggerService } from '../logger/structured-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = request.traceId || (request.headers['x-trace-id'] as string) || 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error occurred';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        errorType = (resObj.error as string) || exception.name;
      } else {
        message = exceptionResponse as string;
        errorType = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          message = `Unique constraint conflict on field(s): ${target.join(', ') || 'resource'}`;
          errorType = 'Conflict';
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found';
          errorType = 'NotFound';
          break;
        }
        default: {
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Database operation constraint violation';
          errorType = 'DatabaseError';
          break;
        }
      }
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : exception.message;
      errorType = exception.name;
    }

    // Structured internal logging with stack trace
    this.logger.error(
      `[HTTP ${statusCode}] ${request.method} ${request.url} - ${Array.isArray(message) ? message.join('; ') : message}`,
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionFilter',
      {
        traceId,
        method: request.method,
        path: request.url,
        statusCode,
        ip: request.ip,
      },
    );

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      traceId,
      message,
      error: errorType,
    });
  }
}
