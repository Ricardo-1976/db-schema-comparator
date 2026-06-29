import { Inject, Injectable } from '@nestjs/common';
import { SchemaComparisonService } from '../../domain/services/schema-comparison.service';
import {
  SCHEMA_EXTRACTOR,
  type SchemaExtractorPort,
} from '../../domain/ports/schema-extractor.port';
import { DatabaseConfig } from 'src/shared/interfaces/database-config.interface';

@Injectable()
export class CompareSchemasUseCase {
  constructor(
    @Inject(SCHEMA_EXTRACTOR)
    private readonly extractor: SchemaExtractorPort,
    private readonly comparator: SchemaComparisonService,
  ) {}

  async execute(configA: DatabaseConfig, configB: DatabaseConfig) {
    const [schemaA, schemaB] = await Promise.all([
      this.extractor.extract(configA, 'Database A'),
      this.extractor.extract(configB, 'Database B'),
    ]);

    return this.comparator.compare(schemaA, schemaB);
  }
}
