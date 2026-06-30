import { SchemaDifference } from '../../domain/contracts/schema-comparison-result';

export function formatDifferenceForReport(diff: SchemaDifference): string {
  switch (diff.type) {
    case 'TABLE_MISSING':
      return `Table exists only in ${diff.existsIn}`;
    case 'COLUMN_MISSING':
      return `Column "${diff.column}" exists only in ${diff.existsIn}`;
    case 'COLUMN_TYPE':
      return `Column "${diff.column}" — A: ${diff.databaseA} | B: ${diff.databaseB}`;
    case 'COLUMN_NULLABLE':
      return `Column "${diff.column}" nullable — A: ${diff.databaseA} | B: ${diff.databaseB}`;
    case 'PRIMARY_KEY':
    case 'FOREIGN_KEY':
    case 'INDEX':
    case 'CONSTRAINT':
      if ('existsIn' in diff) {
        return `${diff.constraint} exists only in ${diff.existsIn}`;
      }
      return `${diff.constraint} — A: ${diff.databaseA} | B: ${diff.databaseB}`;
  }
}
