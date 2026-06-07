import { Controller, Post, Body } from '@nestjs/common';
import { CompareSchemasUseCase } from '../../application/use-cases/compare-schemas.use-case';
import { PostgresSchemaExtractor } from '../../infrastructure/extractors/postgres/postgres-schema-extractor';
import { SchemaComparisonService } from '../../domain/services/schema-comparison.service';

@Controller('compare')
export class CompareController {
  constructor() {}

  @Post()
  async compare(@Body() body: any) {
    const extractorA = new PostgresSchemaExtractor();
    const extractorB = new PostgresSchemaExtractor();

    const comparator = new SchemaComparisonService();

    const useCase = new CompareSchemasUseCase(
      extractorA,
      extractorB,
      comparator,
    );

    return useCase.execute(body.dbA, body.dbB);
  }
}
