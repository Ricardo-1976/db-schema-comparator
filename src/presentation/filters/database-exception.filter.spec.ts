import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DatabaseConnectionException } from '../../domain/exceptions/database-connection.exception';
import { DatabaseExceptionFilter } from './database-exception.filter';

describe('DatabaseExceptionFilter', () => {
  const filter = new DatabaseExceptionFilter();

  it('maps AUTH_FAILED to 400', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHostMock(status);

    filter.catch(
      new DatabaseConnectionException(
        'Database A',
        'AUTH_FAILED',
        'Authentication failed',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        reason: 'AUTH_FAILED',
        database: 'Database A',
      }),
    );
  });

  it('maps UNREACHABLE to 502', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHostMock(status);

    filter.catch(
      new DatabaseConnectionException(
        'Database B',
        'UNREACHABLE',
        'Could not reach database host',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
  });

  it('maps UNKNOWN to 503', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = createHostMock(status);

    filter.catch(
      new DatabaseConnectionException(
        'Database A',
        'UNKNOWN',
        'Failed to connect to database',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });
});

function createHostMock(status: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as ArgumentsHost;
}
