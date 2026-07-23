import { Test, TestingModule } from '@nestjs/testing';
import { SchemaComparisonService } from '../../domain/services/schema-comparison.service';
import {
  SCHEMA_EXTRACTOR,
  SchemaExtractorPort,
} from '../../domain/ports/schema-extractor.port';
import { column, schema, table } from '../../test/helpers/schema.factory';
import { CompareSchemasUseCase } from './compare-schemas.use-case';

describe('CompareSchemasUseCase', () => {
  let useCase: CompareSchemasUseCase;
  let extractor: jest.Mocked<SchemaExtractorPort>;

  beforeEach(async () => {
    extractor = {
      extract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompareSchemasUseCase,
        SchemaComparisonService,
        {
          provide: SCHEMA_EXTRACTOR,
          useValue: extractor,
        },
      ],
    }).compile();

    useCase = module.get(CompareSchemasUseCase);
  });

  it('extracts both schemas in parallel and compares them', async () => {
    const schemaA = schema([table('users', [column('id', 'INTEGER', false)])]);
    const schemaB = schema([table('users', [column('id', 'BIGINT', false)])]);

    extractor.extract.mockImplementation(async (_config, label) => {
      return label === 'Database A' ? schemaA : schemaB;
    });

    const result = await useCase.execute(
      {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'secret',
        database: 'db_a',
      },
      {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'secret',
        database: 'db_b',
      },
    );

    expect(extractor.extract).toHaveBeenCalledTimes(2);
    expect(result.summary.tablesCompared).toBe(1);
    expect(result.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'COLUMN_TYPE', column: 'id' }),
      ]),
    );
  });

  it('executeWithSchemas returns schemas and result', async () => {
    const schemaA = schema([]);
    const schemaB = schema([]);

    extractor.extract.mockImplementation(async (_config, label) => {
      return label === 'Database A' ? schemaA : schemaB;
    });

    const output = await useCase.executeWithSchemas(
      {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'secret',
        database: 'db_a',
      },
      {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'secret',
        database: 'db_b',
      },
    );

    expect(output.schemaA).toBe(schemaA);
    expect(output.schemaB).toBe(schemaB);
    expect(output.result.summary.tablesCompared).toBe(0);
  });
});
