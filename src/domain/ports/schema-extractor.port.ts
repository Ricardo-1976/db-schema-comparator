import { DatabaseConfig } from '../../shared/interfaces/database-config.interface';
import { SchemaEntity } from '../entities/schema.entity';

export interface SchemaExtractorPort {
  extract(config: DatabaseConfig): Promise<SchemaEntity>;
}
