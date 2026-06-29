export type ConstraintKind = 'UNIQUE' | 'CHECK';

export class ConstraintEntity {
  constructor(
    public readonly name: string,
    public readonly type: ConstraintKind,
    public readonly columns: string[],
    public readonly definition: string | null,
  ) {}
}
