import { buildDifferenceNarrative } from './difference-summary.builder';

describe('buildDifferenceNarrative', () => {
  const configA = { host: 'localhost', port: 5432, database: 'db_source' };
  const configB = { host: 'localhost', port: 5432, database: 'db_target' };

  it('returns Compatible when there are no differences', () => {
    const narrative = buildDifferenceNarrative(
      {
        summary: { tablesCompared: 2, equal: 2, different: 0 },
        differences: [],
      },
      configA,
      configB,
    );

    expect(narrative.compatibilityLevel).toBe('Compatible');
    expect(narrative.totalDifferences).toBe(0);
  });

  it('returns Incompatible for critical differences', () => {
    const narrative = buildDifferenceNarrative(
      {
        summary: { tablesCompared: 2, equal: 1, different: 1 },
        differences: [
          { table: 'invoice', type: 'TABLE_MISSING', existsIn: 'Database B' },
        ],
      },
      configA,
      configB,
    );

    expect(narrative.compatibilityLevel).toBe('Incompatible');
  });

  it('returns Partially compatible for non-critical differences', () => {
    const narrative = buildDifferenceNarrative(
      {
        summary: { tablesCompared: 1, equal: 0, different: 1 },
        differences: [
          {
            table: 'users',
            type: 'COLUMN_TYPE',
            column: 'name',
            databaseA: 'VARCHAR(100)',
            databaseB: 'VARCHAR(255)',
          },
        ],
      },
      configA,
      configB,
    );

    expect(narrative.compatibilityLevel).toBe('Partially compatible');
    expect(narrative.categoryRows.find((row) => row.label === 'Columns')?.count).toBe(1);
  });
});
