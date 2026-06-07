import { SchemaEntity } from '../entities/schema.entity';

export interface SchemaExtractorPort {
  extract(config: any): Promise<SchemaEntity>;
}
