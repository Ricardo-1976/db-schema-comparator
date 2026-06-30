import { SchemaDifference } from '../../domain/contracts/schema-comparison-result';

export interface DifferenceTableRow {
  table: string;
  object: string;
  databaseA: string;
  databaseB: string;
}

export function toDifferenceTableRow(
  diff: SchemaDifference,
): DifferenceTableRow {
  switch (diff.type) {
    case 'TABLE_MISSING':
      return {
        table: diff.table,
        object: '—',
        databaseA: diff.existsIn === 'Database A' ? 'Present' : 'Missing',
        databaseB: diff.existsIn === 'Database B' ? 'Present' : 'Missing',
      };
    case 'COLUMN_MISSING':
      return {
        table: diff.table,
        object: diff.column,
        databaseA: diff.existsIn === 'Database A' ? 'Present' : 'Missing',
        databaseB: diff.existsIn === 'Database B' ? 'Present' : 'Missing',
      };
    case 'COLUMN_TYPE':
    case 'COLUMN_NULLABLE':
      return {
        table: diff.table,
        object: diff.column,
        databaseA: diff.databaseA,
        databaseB: diff.databaseB,
      };
    case 'PRIMARY_KEY':
    case 'FOREIGN_KEY':
    case 'INDEX':
    case 'CONSTRAINT':
      if ('existsIn' in diff) {
        return {
          table: diff.table,
          object: diff.constraint,
          databaseA: diff.existsIn === 'Database A' ? 'Present' : 'Missing',
          databaseB: diff.existsIn === 'Database B' ? 'Present' : 'Missing',
        };
      }
      return {
        table: diff.table,
        object: diff.constraint,
        databaseA: diff.databaseA,
        databaseB: diff.databaseB,
      };
  }
}

export function sortDifferences(
  differences: SchemaDifference[],
): SchemaDifference[] {
  return [...differences].sort((left, right) => {
    const byTable = left.table.localeCompare(right.table);
    if (byTable !== 0) {
      return byTable;
    }

    return left.type.localeCompare(right.type);
  });
}
