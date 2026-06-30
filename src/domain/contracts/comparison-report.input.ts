import { SchemaComparisonResult } from './schema-comparison-result';
import { SchemaEntity } from '../entities/schema.entity';

export interface DatabaseReportLabel {
  host: string;
  port: number;
  database: string;
}

export interface ComparisonReportInput {
  configA: DatabaseReportLabel;
  configB: DatabaseReportLabel;
  result: SchemaComparisonResult;
  schemaA: SchemaEntity;
  schemaB: SchemaEntity;
}
