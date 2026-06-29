import { Module } from '@nestjs/common';
import { SchemaComparisonService } from '../domain/services/schema-comparison.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { CompareSchemasUseCase } from './use-cases/compare-schemas.use-case';
import { ExtractSchemaUseCase } from './use-cases/extract-schema.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    SchemaComparisonService,
    CompareSchemasUseCase,
    ExtractSchemaUseCase,
  ],
  exports: [CompareSchemasUseCase, ExtractSchemaUseCase],
})
export class ApplicationModule {}
