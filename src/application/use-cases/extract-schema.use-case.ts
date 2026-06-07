import { DatabaseConfig } from 'src/shared/interfaces/database-config.interface';
import { SchemaExtractorPort } from '../../domain/ports/schema-extractor.port';

export class ExtractSchemaUseCase {
  constructor(private extractor: SchemaExtractorPort) {}

  async execute(config: DatabaseConfig) {
    return this.extractor.extract(config);
  }
}
