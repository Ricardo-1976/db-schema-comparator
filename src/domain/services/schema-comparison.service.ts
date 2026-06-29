import { SchemaEntity } from '../entities/schema.entity';
import { TableEntity } from '../entities/table.entity';
import {
  NamedObjectMissingDifference,
  NamedObjectModifiedDifference,
  SchemaComparisonResult,
  SchemaDifference,
} from '../contracts/schema-comparison-result';
import {
  formatConstraint,
  formatForeignKey,
  formatIndex,
  formatNullable,
  formatPrimaryKey,
} from './schema-formatters';

type NamedDifferenceType =
  | 'PRIMARY_KEY'
  | 'FOREIGN_KEY'
  | 'INDEX'
  | 'CONSTRAINT';

interface NamedItem {
  name: string;
  serialize: () => string;
}

export class SchemaComparisonService {
  compare(source: SchemaEntity, target: SchemaEntity): SchemaComparisonResult {
    const differences: SchemaDifference[] = [];

    const sourceTables = new Map(source.tables.map((t) => [t.name, t]));
    const targetTables = new Map(target.tables.map((t) => [t.name, t]));
    const allTableNames = [
      ...new Set([...sourceTables.keys(), ...targetTables.keys()]),
    ].sort();

    for (const tableName of sourceTables.keys()) {
      if (!targetTables.has(tableName)) {
        differences.push({
          table: tableName,
          type: 'TABLE_MISSING',
          existsIn: 'Database A',
        });
      }
    }

    for (const tableName of targetTables.keys()) {
      if (!sourceTables.has(tableName)) {
        differences.push({
          table: tableName,
          type: 'TABLE_MISSING',
          existsIn: 'Database B',
        });
      }
    }

    for (const tableName of allTableNames) {
      const sourceTable = sourceTables.get(tableName);
      const targetTable = targetTables.get(tableName);

      if (!sourceTable || !targetTable) {
        continue;
      }

      differences.push(...this.compareColumns(sourceTable, targetTable));
      differences.push(...this.comparePrimaryKeys(sourceTable, targetTable));
      differences.push(
        ...this.compareNamedObjects(
          sourceTable,
          targetTable,
          'FOREIGN_KEY',
          sourceTable.foreignKeys.map((fk) => ({
            name: fk.name,
            serialize: () => formatForeignKey(fk),
          })),
          targetTable.foreignKeys.map((fk) => ({
            name: fk.name,
            serialize: () => formatForeignKey(fk),
          })),
        ),
      );
      differences.push(
        ...this.compareNamedObjects(
          sourceTable,
          targetTable,
          'INDEX',
          sourceTable.indexes.map((index) => ({
            name: index.name,
            serialize: () => formatIndex(index),
          })),
          targetTable.indexes.map((index) => ({
            name: index.name,
            serialize: () => formatIndex(index),
          })),
        ),
      );
      differences.push(
        ...this.compareNamedObjects(
          sourceTable,
          targetTable,
          'CONSTRAINT',
          sourceTable.constraints.map((constraint) => ({
            name: constraint.name,
            serialize: () => formatConstraint(constraint),
          })),
          targetTable.constraints.map((constraint) => ({
            name: constraint.name,
            serialize: () => formatConstraint(constraint),
          })),
        ),
      );
    }

    const tablesWithDiff = new Set(differences.map((d) => d.table));

    return {
      summary: {
        tablesCompared: allTableNames.length,
        different: tablesWithDiff.size,
        equal: allTableNames.length - tablesWithDiff.size,
      },
      differences,
    };
  }

  private compareColumns(
    sourceTable: TableEntity,
    targetTable: TableEntity,
  ): SchemaDifference[] {
    const differences: SchemaDifference[] = [];
    const targetColumns = new Map(targetTable.columns.map((c) => [c.name, c]));

    for (const sourceColumn of sourceTable.columns) {
      const targetColumn = targetColumns.get(sourceColumn.name);

      if (!targetColumn) {
        differences.push({
          table: sourceTable.name,
          type: 'COLUMN_MISSING',
          column: sourceColumn.name,
          existsIn: 'Database A',
        });
        continue;
      }

      if (sourceColumn.type !== targetColumn.type) {
        differences.push({
          table: sourceTable.name,
          type: 'COLUMN_TYPE',
          column: sourceColumn.name,
          databaseA: sourceColumn.type,
          databaseB: targetColumn.type,
        });
      }

      if (sourceColumn.nullable !== targetColumn.nullable) {
        differences.push({
          table: sourceTable.name,
          type: 'COLUMN_NULLABLE',
          column: sourceColumn.name,
          databaseA: formatNullable(sourceColumn.nullable),
          databaseB: formatNullable(targetColumn.nullable),
        });
      }
    }

    for (const targetColumn of targetTable.columns) {
      const sourceColumn = sourceTable.columns.find(
        (c) => c.name === targetColumn.name,
      );

      if (!sourceColumn) {
        differences.push({
          table: targetTable.name,
          type: 'COLUMN_MISSING',
          column: targetColumn.name,
          existsIn: 'Database B',
        });
      }
    }

    return differences;
  }

  private comparePrimaryKeys(
    sourceTable: TableEntity,
    targetTable: TableEntity,
  ): SchemaDifference[] {
    const sourcePk = sourceTable.primaryKey;
    const targetPk = targetTable.primaryKey;

    if (!sourcePk && !targetPk) {
      return [];
    }

    if (sourcePk && !targetPk) {
      return [
        {
          table: sourceTable.name,
          type: 'PRIMARY_KEY',
          constraint: sourcePk.name,
          existsIn: 'Database A',
        } satisfies NamedObjectMissingDifference,
      ];
    }

    if (!sourcePk && targetPk) {
      return [
        {
          table: targetTable.name,
          type: 'PRIMARY_KEY',
          constraint: targetPk.name,
          existsIn: 'Database B',
        } satisfies NamedObjectMissingDifference,
      ];
    }

    const sourceSerialized = formatPrimaryKey(sourcePk!);
    const targetSerialized = formatPrimaryKey(targetPk!);

    if (sourceSerialized === targetSerialized) {
      return [];
    }

    return [
      {
        table: sourceTable.name,
        type: 'PRIMARY_KEY',
        constraint: sourcePk!.name,
        databaseA: sourceSerialized,
        databaseB: targetSerialized,
      } satisfies NamedObjectModifiedDifference,
    ];
  }

  private compareNamedObjects(
    sourceTable: TableEntity,
    targetTable: TableEntity,
    type: NamedDifferenceType,
    sourceItems: NamedItem[],
    targetItems: NamedItem[],
  ): SchemaDifference[] {
    const differences: SchemaDifference[] = [];
    const targetByName = new Map(targetItems.map((item) => [item.name, item]));

    for (const sourceItem of sourceItems) {
      const targetItem = targetByName.get(sourceItem.name);

      if (!targetItem) {
        differences.push({
          table: sourceTable.name,
          type,
          constraint: sourceItem.name,
          existsIn: 'Database A',
        });
        continue;
      }

      const sourceValue = sourceItem.serialize();
      const targetValue = targetItem.serialize();

      if (sourceValue !== targetValue) {
        differences.push({
          table: sourceTable.name,
          type,
          constraint: sourceItem.name,
          databaseA: sourceValue,
          databaseB: targetValue,
        });
      }
    }

    const sourceNames = new Set(sourceItems.map((item) => item.name));

    for (const targetItem of targetItems) {
      if (!sourceNames.has(targetItem.name)) {
        differences.push({
          table: targetTable.name,
          type,
          constraint: targetItem.name,
          existsIn: 'Database B',
        });
      }
    }

    return differences;
  }
}
