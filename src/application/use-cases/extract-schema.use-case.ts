import { Inject, Injectable } from '@nestjs/common';
import { DatabaseConfig } from 'src/shared/interfaces/database-config.interface';
import {
  SCHEMA_EXTRACTOR,
  type SchemaExtractorPort,
} from '../../domain/ports/schema-extractor.port';

@Injectable()
export class ExtractSchemaUseCase {
  constructor(
    @Inject(SCHEMA_EXTRACTOR)
    private readonly extractor: SchemaExtractorPort,
  ) {}

  async execute(config: DatabaseConfig) {
    return this.extractor.extract(config, 'Database A');
  }
}
