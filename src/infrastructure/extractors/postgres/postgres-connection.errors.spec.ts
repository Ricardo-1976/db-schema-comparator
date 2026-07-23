import { DatabaseConnectionException } from '../../../domain/exceptions/database-connection.exception';
import { toDatabaseConnectionException } from './postgres-connection.errors';

describe('toDatabaseConnectionException', () => {
  it('maps auth error code to AUTH_FAILED', () => {
    const exception = toDatabaseConnectionException(
      Object.assign(new Error('password authentication failed'), { code: '28P01' }),
      'Database A',
    );

    expect(exception).toBeInstanceOf(DatabaseConnectionException);
    expect(exception.reason).toBe('AUTH_FAILED');
    expect(exception.database).toBe('Database A');
  });

  it('maps invalid database code to INVALID_DATABASE', () => {
    const exception = toDatabaseConnectionException(
      Object.assign(new Error('database does not exist'), { code: '3D000' }),
      'Database B',
    );

    expect(exception.reason).toBe('INVALID_DATABASE');
  });

  it('maps ECONNREFUSED to UNREACHABLE', () => {
    const exception = toDatabaseConnectionException(
      Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      'Database A',
    );

    expect(exception.reason).toBe('UNREACHABLE');
  });

  it('maps timeout message to TIMEOUT', () => {
    const exception = toDatabaseConnectionException(
      new Error('Connection timeout expired'),
      'Database B',
    );

    expect(exception.reason).toBe('TIMEOUT');
  });

  it('returns same DatabaseConnectionException instance', () => {
    const original = new DatabaseConnectionException(
      'Database A',
      'AUTH_FAILED',
      'Authentication failed',
    );

    expect(toDatabaseConnectionException(original, 'Database A')).toBe(original);
  });
});
