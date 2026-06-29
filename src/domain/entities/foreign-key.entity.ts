export class ForeignKeyEntity {
  constructor(
    public readonly name: string,
    public readonly columns: string[],
    public readonly referencedTable: string,
    public readonly referencedColumns: string[],
    public readonly onDelete: string,
    public readonly onUpdate: string,
  ) {}
}
