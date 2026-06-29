export type DatabaseLabel = 'Database A' | 'Database B';

export type DatabaseConnectionReason =
  | 'AUTH_FAILED'
  | 'UNREACHABLE'
  | 'TIMEOUT'
  | 'INVALID_DATABASE'
  | 'UNKNOWN';

export class DatabaseConnectionException extends Error {
  constructor(
    public readonly database: DatabaseLabel,
    public readonly reason: DatabaseConnectionReason,
    message: string,
  ) {
    super(message);
    this.name = 'DatabaseConnectionException';
  }
}
