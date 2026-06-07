import { SchemaEntity } from '../entities/schema.entity';

import {
  SchemaComparisonResult,
  ColumnDifference,
  ModifiedColumn,
} from '../contracts/schema-comparison-result';

export class SchemaComparisonService {
  compare(source: SchemaEntity, target: SchemaEntity): SchemaComparisonResult {
    const onlyInSourceTables = source.tables
      .filter(
        (sourceTable) =>
          !target.tables.some(
            (targetTable) => targetTable.name === sourceTable.name,
          ),
      )
      .map((table) => table.name);

    const onlyInTargetTables = target.tables
      .filter(
        (targetTable) =>
          !source.tables.some(
            (sourceTable) => sourceTable.name === targetTable.name,
          ),
      )
      .map((table) => table.name);

    const onlyInSourceColumns: ColumnDifference[] = [];
    const onlyInTargetColumns: ColumnDifference[] = [];
    const modifiedColumns: ModifiedColumn[] = [];

    for (const sourceTable of source.tables) {
      const targetTable = target.tables.find(
        (table) => table.name === sourceTable.name,
      );

      if (!targetTable) {
        continue;
      }

      for (const sourceColumn of sourceTable.columns) {
        const targetColumn = targetTable.columns.find(
          (column) => column.name === sourceColumn.name,
        );

        if (!targetColumn) {
          onlyInSourceColumns.push({
            table: sourceTable.name,
            column: sourceColumn.name,
          });

          continue;
        }

        if (
          sourceColumn.type !== targetColumn.type ||
          sourceColumn.nullable !== targetColumn.nullable
        ) {
          modifiedColumns.push({
            table: sourceTable.name,
            column: sourceColumn.name,

            source: {
              type: sourceColumn.type,
              nullable: sourceColumn.nullable,
            },

            target: {
              type: targetColumn.type,
              nullable: targetColumn.nullable,
            },
          });
        }
      }

      for (const targetColumn of targetTable.columns) {
        const sourceColumn = sourceTable.columns.find(
          (column) => column.name === targetColumn.name,
        );

        if (!sourceColumn) {
          onlyInTargetColumns.push({
            table: targetTable.name,
            column: targetColumn.name,
          });
        }
      }
    }

    const totalDifferences =
      onlyInSourceTables.length +
      onlyInTargetTables.length +
      onlyInSourceColumns.length +
      onlyInTargetColumns.length +
      modifiedColumns.length;

    const status: 'identical' | 'different' =
      totalDifferences === 0 ? 'identical' : 'different';

    return {
      status,

      summary: {
        tables: onlyInSourceTables.length + onlyInTargetTables.length,

        columns:
          onlyInSourceColumns.length +
          onlyInTargetColumns.length +
          modifiedColumns.length,
      },

      differences: {
        tables: {
          onlyInSource: onlyInSourceTables,
          onlyInTarget: onlyInTargetTables,
        },

        columns: {
          onlyInSource: onlyInSourceColumns,
          onlyInTarget: onlyInTargetColumns,
          modified: modifiedColumns,
        },
      },
    };
  }
}
