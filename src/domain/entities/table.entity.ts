import { ColumnEntity } from './column.entity';

export class TableEntity {
  constructor(
    public readonly name: string,
    public readonly columns: ColumnEntity[],
  ) {}
}
