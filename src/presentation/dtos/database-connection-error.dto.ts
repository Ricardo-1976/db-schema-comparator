import { ApiProperty } from '@nestjs/swagger';

export class DatabaseConnectionErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Database Connection Error' })
  error: string;

  @ApiProperty({ example: 'Database A', enum: ['Database A', 'Database B'] })
  database: string;

  @ApiProperty({
    example: 'AUTH_FAILED',
    enum: [
      'AUTH_FAILED',
      'INVALID_DATABASE',
      'UNREACHABLE',
      'TIMEOUT',
      'UNKNOWN',
    ],
  })
  reason: string;

  @ApiProperty({ example: 'Authentication failed' })
  message: string;
}
