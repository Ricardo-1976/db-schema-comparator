import { sortDifferences, toDifferenceTableRow } from './difference-table-rows';

describe('difference-table-rows', () => {
  it('maps TABLE_MISSING to Present/Missing columns', () => {
    expect(
      toDifferenceTableRow({
        table: 'invoice',
        type: 'TABLE_MISSING',
        existsIn: 'Database B',
      }),
    ).toEqual({
      table: 'invoice',
      object: '—',
      databaseA: 'Missing',
      databaseB: 'Present',
    });
  });

  it('maps COLUMN_TYPE to database values', () => {
    expect(
      toDifferenceTableRow({
        table: 'customer',
        type: 'COLUMN_TYPE',
        column: 'name',
        databaseA: 'VARCHAR(100)',
        databaseB: 'VARCHAR(255)',
      }),
    ).toEqual({
      table: 'customer',
      object: 'name',
      databaseA: 'VARCHAR(100)',
      databaseB: 'VARCHAR(255)',
    });
  });

  it('maps missing named object using existsIn', () => {
    expect(
      toDifferenceTableRow({
        table: 'users',
        type: 'PRIMARY_KEY',
        constraint: 'users_pkey',
        existsIn: 'Database A',
      }),
    ).toEqual({
      table: 'users',
      object: 'users_pkey',
      databaseA: 'Present',
      databaseB: 'Missing',
    });
  });

  it('sorts differences by table and type', () => {
    const sorted = sortDifferences([
      { table: 'users', type: 'COLUMN_TYPE', column: 'a', databaseA: 'A', databaseB: 'B' },
      { table: 'customer', type: 'TABLE_MISSING', existsIn: 'Database A' },
      { table: 'users', type: 'TABLE_MISSING', existsIn: 'Database B' },
    ]);

    expect(sorted.map((item) => `${item.table}:${item.type}`)).toEqual([
      'customer:TABLE_MISSING',
      'users:COLUMN_TYPE',
      'users:TABLE_MISSING',
    ]);
  });
});
