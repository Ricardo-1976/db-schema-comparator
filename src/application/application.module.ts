import { Module } from '@nestjs/common';
import { SchemaComparisonService } from '../domain/services/schema-comparison.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CompareSchemasUseCase } from './use-cases/compare-schemas.use-case';
import { ExtractSchemaUseCase } from './use-cases/extract-schema.use-case';
import { GenerateComparisonPdfUseCase } from './use-cases/generate-comparison-pdf.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    SchemaComparisonService,
    CompareSchemasUseCase,
    ExtractSchemaUseCase,
    GenerateComparisonPdfUseCase,
  ],
  exports: [
    CompareSchemasUseCase,
    ExtractSchemaUseCase,
    GenerateComparisonPdfUseCase,
  ],
})
export class ApplicationModule {}
