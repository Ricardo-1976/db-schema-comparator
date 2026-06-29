import { ConstraintEntity } from '../entities/constraint.entity';
import { ForeignKeyEntity } from '../entities/foreign-key.entity';
import { IndexEntity } from '../entities/index.entity';
import { PrimaryKeyEntity } from '../entities/primary-key.entity';

export function formatPrimaryKey(pk: PrimaryKeyEntity): string {
  return `(${pk.columns.join(', ')})`;
}

export function formatForeignKey(fk: ForeignKeyEntity): string {
  const source = `${fk.columns.join(', ')} → ${fk.referencedTable}(${fk.referencedColumns.join(', ')})`;
  return `${source} ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`;
}

export function formatIndex(index: IndexEntity): string {
  const unique = index.unique ? 'UNIQUE ' : '';
  return `${unique}${index.method} (${index.columns.join(', ')})`;
}

export function formatConstraint(constraint: ConstraintEntity): string {
  if (constraint.type === 'UNIQUE') {
    return `UNIQUE (${constraint.columns.join(', ')})`;
  }

  return `CHECK ${constraint.definition ?? ''}`;
}

export function formatNullable(nullable: boolean): string {
  return nullable ? 'NULL' : 'NOT NULL';
}
