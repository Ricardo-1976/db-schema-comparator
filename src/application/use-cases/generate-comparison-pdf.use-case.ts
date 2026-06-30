import { Inject, Injectable } from '@nestjs/common';
import { DatabaseConfig } from 'src/shared/interfaces/database-config.interface';
import {
  COMPARISON_REPORT_GENERATOR,
  type ComparisonReportPort,
} from '../../domain/ports/comparison-report.port';
import { CompareSchemasUseCase } from './compare-schemas.use-case';

@Injectable()
export class GenerateComparisonPdfUseCase {
  constructor(
    private readonly compareSchemasUseCase: CompareSchemasUseCase,
    @Inject(COMPARISON_REPORT_GENERATOR)
    private readonly reportGenerator: ComparisonReportPort,
  ) {}

  async execute(
    configA: DatabaseConfig,
    configB: DatabaseConfig,
  ): Promise<Buffer> {
    const { result, schemaA, schemaB } =
      await this.compareSchemasUseCase.executeWithSchemas(configA, configB);

    return this.reportGenerator.generate({
      configA: {
        host: configA.host,
        port: configA.port,
        database: configA.database,
      },
      configB: {
        host: configB.host,
        port: configB.port,
        database: configB.database,
      },
      result,
      schemaA,
      schemaB,
    });
  }
}
