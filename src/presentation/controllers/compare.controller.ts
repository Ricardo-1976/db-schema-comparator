import { Controller, Post, Body } from '@nestjs/common';
import { CompareSchemasUseCase } from '../../application/use-cases/compare-schemas.use-case';
import { PostgresSchemaExtractor } from '../../infrastructure/extractors/postgres/postgres-schema-extractor';
import { SchemaComparisonService } from '../../domain/services/schema-comparison.service';
import { CompareRequestDto } from '../dtos/compare-request.dto';

@Controller('compare')
export class CompareController {
  constructor() {}

  @Post()
  async compare(@Body() dto: CompareRequestDto) {
    const extractorA = new PostgresSchemaExtractor();
    const extractorB = new PostgresSchemaExtractor();

    const comparator = new SchemaComparisonService();

    const useCase = new CompareSchemasUseCase(
      extractorA,
      extractorB,
      comparator,
    );

    return useCase.execute(dto.dbA, dto.dbB);
  }
}
