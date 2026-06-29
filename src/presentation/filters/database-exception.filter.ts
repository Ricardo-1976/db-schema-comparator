import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import {
  DatabaseConnectionException,
  type DatabaseConnectionReason,
} from '../../domain/exceptions/database-connection.exception';

@Catch(DatabaseConnectionException)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: DatabaseConnectionException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(this.toHttpStatus(exception.reason)).json({
      statusCode: this.toHttpStatus(exception.reason),
      error: 'Database Connection Error',
      database: exception.database,
      reason: exception.reason,
      message: exception.message,
    });
  }

  private toHttpStatus(reason: DatabaseConnectionReason): number {
    switch (reason) {
      case 'AUTH_FAILED':
      case 'INVALID_DATABASE':
        return HttpStatus.BAD_REQUEST;
      case 'UNREACHABLE':
      case 'TIMEOUT':
        return HttpStatus.BAD_GATEWAY;
      default:
        return HttpStatus.SERVICE_UNAVAILABLE;
    }
  }
}
