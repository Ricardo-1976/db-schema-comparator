import { ColumnEntity } from '../../domain/entities/column.entity';
import { ConstraintEntity } from '../../domain/entities/constraint.entity';
import { ForeignKeyEntity } from '../../domain/entities/foreign-key.entity';
import { IndexEntity } from '../../domain/entities/index.entity';
import { PrimaryKeyEntity } from '../../domain/entities/primary-key.entity';
import { SchemaEntity } from '../../domain/entities/schema.entity';
import { TableEntity } from '../../domain/entities/table.entity';

export function column(
  name: string,
  type: string,
  nullable: boolean,
): ColumnEntity {
  return new ColumnEntity(name, type, nullable);
}

export function table(
  name: string,
  columns: ColumnEntity[],
  options: {
    primaryKey?: PrimaryKeyEntity | null;
    foreignKeys?: ForeignKeyEntity[];
    indexes?: IndexEntity[];
    constraints?: ConstraintEntity[];
  } = {},
): TableEntity {
  return new TableEntity(
    name,
    columns,
    options.primaryKey ?? null,
    options.foreignKeys ?? [],
    options.indexes ?? [],
    options.constraints ?? [],
  );
}

export function schema(tables: TableEntity[]): SchemaEntity {
  return new SchemaEntity(tables);
}

export const validComparePayload = {
  dbA: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'secret',
    database: 'db_source',
  },
  dbB: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'secret',
    database: 'db_target',
  },
};
