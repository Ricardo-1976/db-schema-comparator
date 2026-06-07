import { SchemaComparisonService } from '../../domain/services/schema-comparison.service';
import { SchemaExtractorPort } from '../../domain/ports/schema-extractor.port';

export class CompareSchemasUseCase {
  constructor(
    private extractorA: SchemaExtractorPort,
    private extractorB: SchemaExtractorPort,
    private comparator: SchemaComparisonService,
  ) {}

  async execute(configA: any, configB: any) {
    const schemaA = await this.extractorA.extract(configA);
    const schemaB = await this.extractorB.extract(configB);

    return this.comparator.compare(schemaA, schemaB);
  }
}
