export class PrimaryKeyEntity {
  constructor(
    public readonly name: string,
    public readonly columns: string[],
  ) {}
}
