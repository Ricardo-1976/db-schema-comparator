import { TableEntity } from './table.entity';

export class SchemaEntity {
  constructor(public readonly tables: TableEntity[]) {}
}
