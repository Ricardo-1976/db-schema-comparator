export class IndexEntity {
  constructor(
    public readonly name: string,
    public readonly columns: string[],
    public readonly unique: boolean,
    public readonly method: string,
  ) {}
}
