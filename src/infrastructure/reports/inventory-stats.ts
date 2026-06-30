import { TableEntity } from '../../domain/entities/table.entity';

export interface InventoryStats {
  tables: number;
  columns: number;
  primaryKeys: number;
  foreignKeys: number;
  indexes: number;
  constraints: number;
}

export function computeInventoryStats(tables: TableEntity[]): InventoryStats {
  return {
    tables: tables.length,
    columns: tables.reduce((total, table) => total + table.columns.length, 0),
    primaryKeys: tables.filter((table) => table.primaryKey !== null).length,
    foreignKeys: tables.reduce(
      (total, table) => total + table.foreignKeys.length,
      0,
    ),
    indexes: tables.reduce((total, table) => total + table.indexes.length, 0),
    constraints: tables.reduce(
      (total, table) => total + table.constraints.length,
      0,
    ),
  };
}

export function formatInventoryStats(stats: InventoryStats): string {
  return (
    `${stats.tables} tables · ${stats.columns} columns · ` +
    `${stats.primaryKeys} primary keys · ${stats.foreignKeys} foreign keys · ` +
    `${stats.indexes} indexes · ${stats.constraints} constraints`
  );
}
