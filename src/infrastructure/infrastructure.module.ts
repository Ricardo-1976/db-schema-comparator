import { Module } from '@nestjs/common';
import { SCHEMA_EXTRACTOR } from '../domain/ports/schema-extractor.port';
import { COMPARISON_REPORT_GENERATOR } from '../domain/ports/comparison-report.port';
import { PostgresSchemaExtractor } from './extractors/postgres/postgres-schema-extractor';
import { PdfComparisonReportGenerator } from './reports/pdf-comparison-report.generator';

@Module({
  providers: [
    {
      provide: SCHEMA_EXTRACTOR,
      useClass: PostgresSchemaExtractor,
    },
    {
      provide: COMPARISON_REPORT_GENERATOR,
      useClass: PdfComparisonReportGenerator,
    },
  ],
  exports: [SCHEMA_EXTRACTOR, COMPARISON_REPORT_GENERATOR],
})
export class InfrastructureModule {}
