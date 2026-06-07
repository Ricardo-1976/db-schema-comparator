export interface ColumnDifference {
  table: string;
  column: string;
}

export interface ColumnDefinition {
  type: string;
  nullable: boolean;
}

export interface ModifiedColumn {
  table: string;
  column: string;
  source: ColumnDefinition;
  target: ColumnDefinition;
}

export interface SchemaComparisonResult {
  status: 'identical' | 'different';

  summary: {
    tables: number;
    columns: number;
  };

  differences: {
    tables: {
      onlyInSource: string[];
      onlyInTarget: string[];
    };

    columns: {
      onlyInSource: ColumnDifference[];
      onlyInTarget: ColumnDifference[];
      modified: ModifiedColumn[];
    };
  };
}
