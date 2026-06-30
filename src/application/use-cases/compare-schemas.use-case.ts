import { Inject, Injectable } from '@nestjs/common';
import { SchemaComparisonService } from '../../domain/services/schema-comparison.service';
import { SchemaEntity } from '../../domain/entities/schema.entity';
import { SchemaComparisonResult } from '../../domain/contracts/schema-comparison-result';
import {
  SCHEMA_EXTRACTOR,
  type SchemaExtractorPort,
} from '../../domain/ports/schema-extractor.port';
import { DatabaseConfig } from 'src/shared/interfaces/database-config.interface';

export interface CompareSchemasOutput {
  result: SchemaComparisonResult;
  schemaA: SchemaEntity;
  schemaB: SchemaEntity;
}

@Injectable()
export class CompareSchemasUseCase {
  constructor(
    @Inject(SCHEMA_EXTRACTOR)
    private readonly extractor: SchemaExtractorPort,
    private readonly comparator: SchemaComparisonService,
  ) {}

  async executeWithSchemas(
    configA: DatabaseConfig,
    configB: DatabaseConfig,
  ): Promise<CompareSchemasOutput> {
    const [schemaA, schemaB] = await Promise.all([
      this.extractor.extract(configA, 'Database A'),
      this.extractor.extract(configB, 'Database B'),
    ]);

    const result = this.comparator.compare(schemaA, schemaB);

    return { result, schemaA, schemaB };
  }

  async execute(configA: DatabaseConfig, configB: DatabaseConfig) {
    const { result } = await this.executeWithSchemas(configA, configB);
    return result;
  }
}
