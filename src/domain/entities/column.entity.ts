export class ColumnEntity {
  constructor(
    public readonly name: string,
    public readonly type: string,
    public readonly nullable: boolean,
  ) {}
}
