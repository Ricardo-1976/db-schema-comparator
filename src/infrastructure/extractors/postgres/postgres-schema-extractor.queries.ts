/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Client } from 'pg';

import { ConstraintEntity } from '../../../domain/entities/constraint.entity';
import { ColumnEntity } from '../../../domain/entities/column.entity';
import { ForeignKeyEntity } from '../../../domain/entities/foreign-key.entity';
import { IndexEntity } from '../../../domain/entities/index.entity';
import { PrimaryKeyEntity } from '../../../domain/entities/primary-key.entity';
import { SchemaEntity } from '../../../domain/entities/schema.entity';
import { TableEntity } from '../../../domain/entities/table.entity';

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  table_name: string;
  column_name: string;
  full_type: string;
  is_nullable: 'YES' | 'NO';
}

interface PrimaryKeyRow {
  table_name: string;
  constraint_name: string;
  column_name: string;
  ordinal_position: number;
}

interface ForeignKeyRow {
  table_name: string;
  constraint_name: string;
  column_name: string;
  referenced_table: string;
  referenced_column: string;
  delete_rule: string;
  update_rule: string;
  ordinal_position: number;
}

interface UniqueConstraintRow {
  table_name: string;
  constraint_name: string;
  column_name: string;
  ordinal_position: number;
}

interface CheckConstraintRow {
  table_name: string;
  constraint_name: string;
  check_clause: string;
}

interface IndexRow {
  table_name: string;
  index_name: string;
  is_unique: boolean;
  method: string;
  column_name: string;
  ordinal_position: number;
}

const SCHEMA = 'public';

export async function extractPostgresSchema(
  client: Client,
): Promise<SchemaEntity> {
  const tablesRes = await client.query<TableRow>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = '${SCHEMA}'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const columnsRes = await client.query<ColumnRow>(`
    SELECT
      table_name,
      column_name,
      is_nullable,
      CASE
        WHEN data_type = 'character varying' AND character_maximum_length IS NOT NULL
          THEN 'VARCHAR(' || character_maximum_length || ')'
        WHEN data_type = 'character' AND character_maximum_length IS NOT NULL
          THEN 'CHAR(' || character_maximum_length || ')'
        WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL
          THEN 'NUMERIC(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
        WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
        WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
        WHEN data_type = 'double precision' THEN 'DOUBLE PRECISION'
        WHEN data_type = 'integer' THEN 'INTEGER'
        WHEN data_type = 'bigint' THEN 'BIGINT'
        WHEN data_type = 'boolean' THEN 'BOOLEAN'
        WHEN data_type = 'text' THEN 'TEXT'
        WHEN data_type = 'uuid' THEN 'UUID'
        WHEN data_type = 'jsonb' THEN 'JSONB'
        ELSE UPPER(REPLACE(data_type, ' ', '_'))
      END AS full_type
    FROM information_schema.columns
    WHERE table_schema = '${SCHEMA}'
    ORDER BY table_name, ordinal_position
  `);

  const pkRes = await client.query<PrimaryKeyRow>(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = '${SCHEMA}'
    ORDER BY tc.table_name, kcu.ordinal_position
  `);

  const fkRes = await client.query<ForeignKeyRow>(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND rc.unique_constraint_schema = ccu.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = '${SCHEMA}'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `);

  const uniqueRes = await client.query<UniqueConstraintRow>(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema = '${SCHEMA}'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `);

  const checkRes = await client.query<CheckConstraintRow>(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
      AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK'
      AND tc.table_schema = '${SCHEMA}'
      AND cc.check_clause NOT LIKE '% IS NOT NULL'
    ORDER BY tc.table_name, tc.constraint_name
  `);

  const indexRes = await client.query<IndexRow>(`
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      ix.indisunique AS is_unique,
      am.amname AS method,
      a.attname AS column_name,
      k.n AS ordinal_position
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE n.nspname = '${SCHEMA}'
      AND t.relkind = 'r'
      AND NOT ix.indisprimary
      AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conindid = ix.indexrelid
          AND c.contype IN ('u', 'p')
      )
    ORDER BY t.relname, i.relname, k.n
  `);

  const columnsByTable = groupColumns(columnsRes.rows);
  const primaryKeysByTable = groupPrimaryKeys(pkRes.rows);
  const foreignKeysByTable = groupForeignKeys(fkRes.rows);
  const constraintsByTable = groupConstraints(uniqueRes.rows, checkRes.rows);
  const indexesByTable = groupIndexes(indexRes.rows);

  const tables = tablesRes.rows.map(
    (row) =>
      new TableEntity(
        row.table_name,
        columnsByTable.get(row.table_name) ?? [],
        primaryKeysByTable.get(row.table_name) ?? null,
        foreignKeysByTable.get(row.table_name) ?? [],
        indexesByTable.get(row.table_name) ?? [],
        constraintsByTable.get(row.table_name) ?? [],
      ),
  );

  return new SchemaEntity(tables);
}

function groupColumns(rows: ColumnRow[]): Map<string, ColumnEntity[]> {
  const map = new Map<string, ColumnEntity[]>();

  for (const row of rows) {
    const columns = map.get(row.table_name) ?? [];
    columns.push(
      new ColumnEntity(
        row.column_name,
        row.full_type,
        row.is_nullable === 'YES',
      ),
    );
    map.set(row.table_name, columns);
  }

  return map;
}

function groupPrimaryKeys(
  rows: PrimaryKeyRow[],
): Map<string, PrimaryKeyEntity> {
  const grouped = new Map<string, { name: string; columns: string[] }>();

  for (const row of rows) {
    const key = row.table_name;
    const entry = grouped.get(key) ?? {
      name: row.constraint_name,
      columns: [],
    };
    entry.columns.push(row.column_name);
    grouped.set(key, entry);
  }

  const result = new Map<string, PrimaryKeyEntity>();
  for (const [tableName, { name, columns }] of grouped) {
    result.set(tableName, new PrimaryKeyEntity(name, columns));
  }

  return result;
}

function groupForeignKeys(
  rows: ForeignKeyRow[],
): Map<string, ForeignKeyEntity[]> {
  const grouped = new Map<
    string,
    Map<
      string,
      {
        columns: string[];
        referencedTable: string;
        referencedColumns: string[];
        onDelete: string;
        onUpdate: string;
      }
    >
  >();

  for (const row of rows) {
    const tableMap =
      grouped.get(row.table_name) ??
      new Map<
        string,
        {
          columns: string[];
          referencedTable: string;
          referencedColumns: string[];
          onDelete: string;
          onUpdate: string;
        }
      >();

    const fk = tableMap.get(row.constraint_name) ?? {
      columns: [],
      referencedTable: row.referenced_table,
      referencedColumns: [],
      onDelete: row.delete_rule,
      onUpdate: row.update_rule,
    };

    fk.columns.push(row.column_name);
    fk.referencedColumns.push(row.referenced_column);
    tableMap.set(row.constraint_name, fk);
    grouped.set(row.table_name, tableMap);
  }

  const result = new Map<string, ForeignKeyEntity[]>();

  for (const [tableName, fks] of grouped) {
    result.set(
      tableName,
      [...fks.entries()].map(
        ([name, fk]) =>
          new ForeignKeyEntity(
            name,
            fk.columns,
            fk.referencedTable,
            fk.referencedColumns,
            fk.onDelete,
            fk.onUpdate,
          ),
      ),
    );
  }

  return result;
}

function groupConstraints(
  uniqueRows: UniqueConstraintRow[],
  checkRows: CheckConstraintRow[],
): Map<string, ConstraintEntity[]> {
  const grouped = new Map<string, ConstraintEntity[]>();
  const uniqueGrouped = new Map<string, Map<string, string[]>>();

  for (const row of uniqueRows) {
    const tableMap =
      uniqueGrouped.get(row.table_name) ?? new Map<string, string[]>();
    const columns = tableMap.get(row.constraint_name) ?? [];
    columns.push(row.column_name);
    tableMap.set(row.constraint_name, columns);
    uniqueGrouped.set(row.table_name, tableMap);
  }

  for (const [tableName, constraints] of uniqueGrouped) {
    const list = grouped.get(tableName) ?? [];
    for (const [name, columns] of constraints) {
      list.push(new ConstraintEntity(name, 'UNIQUE', columns, null));
    }
    grouped.set(tableName, list);
  }

  for (const row of checkRows) {
    const list = grouped.get(row.table_name) ?? [];
    list.push(
      new ConstraintEntity(row.constraint_name, 'CHECK', [], row.check_clause),
    );
    grouped.set(row.table_name, list);
  }

  return grouped;
}

function groupIndexes(rows: IndexRow[]): Map<string, IndexEntity[]> {
  const grouped = new Map<
    string,
    Map<string, { unique: boolean; method: string; columns: string[] }>
  >();

  for (const row of rows) {
    const tableMap =
      grouped.get(row.table_name) ??
      new Map<string, { unique: boolean; method: string; columns: string[] }>();

    const index = tableMap.get(row.index_name) ?? {
      unique: row.is_unique,
      method: row.method,
      columns: [],
    };

    index.columns.push(row.column_name);
    tableMap.set(row.index_name, index);
    grouped.set(row.table_name, tableMap);
  }

  const result = new Map<string, IndexEntity[]>();

  for (const [tableName, indexes] of grouped) {
    result.set(
      tableName,
      [...indexes.entries()].map(
        ([name, index]) =>
          new IndexEntity(name, index.columns, index.unique, index.method),
      ),
    );
  }

  return result;
}
