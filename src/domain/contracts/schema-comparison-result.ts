export type DatabaseSide = 'Database A' | 'Database B';

export type DifferenceType =
  | 'TABLE_MISSING'
  | 'COLUMN_MISSING'
  | 'COLUMN_TYPE'
  | 'COLUMN_NULLABLE'
  | 'PRIMARY_KEY'
  | 'FOREIGN_KEY'
  | 'INDEX'
  | 'CONSTRAINT';

export interface SchemaComparisonSummary {
  tablesCompared: number;
  equal: number;
  different: number;
}

interface DifferenceBase {
  table: string;
  type: DifferenceType;
}

export interface TableMissingDifference extends DifferenceBase {
  type: 'TABLE_MISSING';
  existsIn: DatabaseSide;
}

export interface ColumnMissingDifference extends DifferenceBase {
  type: 'COLUMN_MISSING';
  column: string;
  existsIn: DatabaseSide;
}

export interface ColumnTypeDifference extends DifferenceBase {
  type: 'COLUMN_TYPE';
  column: string;
  databaseA: string;
  databaseB: string;
}

export interface ColumnNullableDifference extends DifferenceBase {
  type: 'COLUMN_NULLABLE';
  column: string;
  databaseA: string;
  databaseB: string;
}

export interface NamedObjectMissingDifference extends DifferenceBase {
  type: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'INDEX' | 'CONSTRAINT';
  constraint: string;
  existsIn: DatabaseSide;
}

export interface NamedObjectModifiedDifference extends DifferenceBase {
  type: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'INDEX' | 'CONSTRAINT';
  constraint: string;
  databaseA: string;
  databaseB: string;
}

export type SchemaDifference =
  | TableMissingDifference
  | ColumnMissingDifference
  | ColumnTypeDifference
  | ColumnNullableDifference
  | NamedObjectMissingDifference
  | NamedObjectModifiedDifference;

export interface SchemaComparisonResult {
  summary: SchemaComparisonSummary;
  differences: SchemaDifference[];
}
