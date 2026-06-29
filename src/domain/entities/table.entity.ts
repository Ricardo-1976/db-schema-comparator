import { ColumnEntity } from './column.entity';
import { ConstraintEntity } from './constraint.entity';
import { ForeignKeyEntity } from './foreign-key.entity';
import { IndexEntity } from './index.entity';
import { PrimaryKeyEntity } from './primary-key.entity';

export class TableEntity {
  constructor(
    public readonly name: string,
    public readonly columns: ColumnEntity[],
    public readonly primaryKey: PrimaryKeyEntity | null = null,
    public readonly foreignKeys: ForeignKeyEntity[] = [],
    public readonly indexes: IndexEntity[] = [],
    public readonly constraints: ConstraintEntity[] = [],
  ) {}
}
