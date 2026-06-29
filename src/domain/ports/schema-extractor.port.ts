import { DatabaseConfig } from '../../shared/interfaces/database-config.interface';
import { DatabaseLabel } from '../exceptions/database-connection.exception';
import { SchemaEntity } from '../entities/schema.entity';

export const SCHEMA_EXTRACTOR = Symbol('SCHEMA_EXTRACTOR');

export interface SchemaExtractorPort {
  extract(
    config: DatabaseConfig,
    database: DatabaseLabel,
  ): Promise<SchemaEntity>;
}
