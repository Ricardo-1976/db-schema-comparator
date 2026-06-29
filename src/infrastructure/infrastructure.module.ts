import { Module } from '@nestjs/common';
import { SCHEMA_EXTRACTOR } from '../domain/ports/schema-extractor.port';
import { PostgresSchemaExtractor } from './extractors/postgres/postgres-schema-extractor';

@Module({
  providers: [
    {
      provide: SCHEMA_EXTRACTOR,
      useClass: PostgresSchemaExtractor,
    },
  ],
  exports: [SCHEMA_EXTRACTOR],
})
export class InfrastructureModule {}
