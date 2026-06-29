import {
  DatabaseConnectionException,
  type DatabaseConnectionReason,
  type DatabaseLabel,
} from '../../../domain/exceptions/database-connection.exception';

const CONNECTION_TIMEOUT_MS = 5_000;

export { CONNECTION_TIMEOUT_MS };

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to connect to database';
}

function mapCodeToReason(code: string | undefined): DatabaseConnectionReason {
  switch (code) {
    case '28P01':
    case '28000':
      return 'AUTH_FAILED';
    case '3D000':
      return 'INVALID_DATABASE';
    case 'ETIMEDOUT':
    case 'ECONNRESET':
      return 'TIMEOUT';
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'EHOSTUNREACH':
    case 'ENETUNREACH':
      return 'UNREACHABLE';
    default:
      return 'UNKNOWN';
  }
}

function reasonToMessage(reason: DatabaseConnectionReason): string {
  switch (reason) {
    case 'AUTH_FAILED':
      return 'Authentication failed';
    case 'INVALID_DATABASE':
      return 'Database does not exist';
    case 'UNREACHABLE':
      return 'Could not reach database host';
    case 'TIMEOUT':
      return 'Database connection timed out';
    default:
      return 'Failed to connect to database';
  }
}

export function toDatabaseConnectionException(
  error: unknown,
  database: DatabaseLabel,
): DatabaseConnectionException {
  if (error instanceof DatabaseConnectionException) {
    return error;
  }

  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  if (message.toLowerCase().includes('timeout')) {
    return new DatabaseConnectionException(
      database,
      'TIMEOUT',
      reasonToMessage('TIMEOUT'),
    );
  }

  const reason = mapCodeToReason(code);

  return new DatabaseConnectionException(
    database,
    reason,
    reasonToMessage(reason),
  );
}
