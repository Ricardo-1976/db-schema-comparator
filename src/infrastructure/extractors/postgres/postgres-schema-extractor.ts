/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { Client } from 'pg';

import { DatabaseLabel } from '../../../domain/exceptions/database-connection.exception';
import { SchemaExtractorPort } from '../../../domain/ports/schema-extractor.port';
import { SchemaEntity } from '../../../domain/entities/schema.entity';
import { DatabaseConfig } from '../../../shared/interfaces/database-config.interface';
import {
  CONNECTION_TIMEOUT_MS,
  toDatabaseConnectionException,
} from './postgres-connection.errors';
import { extractPostgresSchema } from './postgres-schema-extractor.queries';

@Injectable()
export class PostgresSchemaExtractor implements SchemaExtractorPort {
  async extract(
    config: DatabaseConfig,
    database: DatabaseLabel,
  ): Promise<SchemaEntity> {
    const client = new Client({
      ...config,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });

    try {
      await client.connect();
      return await extractPostgresSchema(client);
    } catch (error) {
      throw toDatabaseConnectionException(error, database);
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
