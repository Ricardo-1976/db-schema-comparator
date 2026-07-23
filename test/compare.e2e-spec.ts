import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupSwagger } from '../src/docs/swagger.config';
import { DatabaseConnectionException } from '../src/domain/exceptions/database-connection.exception';
import { SCHEMA_EXTRACTOR } from '../src/domain/ports/schema-extractor.port';
import { DatabaseExceptionFilter } from '../src/presentation/filters/database-exception.filter';
import {
  column,
  schema,
  table,
  validComparePayload,
} from '../src/test/helpers/schema.factory';

describe('Compare API (e2e)', () => {
  let app: INestApplication<App>;
  let extractMock: jest.Mock;

  beforeEach(async () => {
    extractMock = jest.fn().mockResolvedValue(schema([]));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SCHEMA_EXTRACTOR)
      .useValue({ extract: extractMock })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new DatabaseExceptionFilter());
    setupSwagger(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /compare returns comparison result', async () => {
    extractMock
      .mockResolvedValueOnce(
        schema([table('users', [column('id', 'INTEGER', false)])]),
      )
      .mockResolvedValueOnce(
        schema([table('users', [column('id', 'BIGINT', false)])]),
      );

    const response = await request(app.getHttpServer())
      .post('/compare')
      .send(validComparePayload)
      .expect(201);

    expect(response.body.summary.tablesCompared).toBe(1);
    expect(response.body.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'COLUMN_TYPE', column: 'id' }),
      ]),
    );
  });

  it('POST /compare rejects payload with unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/compare')
      .send({ ...validComparePayload, extraField: true })
      .expect(400);
  });

  it('POST /compare rejects invalid database config', async () => {
    await request(app.getHttpServer())
      .post('/compare')
      .send({
        dbA: { ...validComparePayload.dbA, port: 0 },
        dbB: validComparePayload.dbB,
      })
      .expect(400);
  });

  it('POST /compare maps connection errors to HTTP status', async () => {
    extractMock.mockRejectedValueOnce(
      new DatabaseConnectionException(
        'Database A',
        'AUTH_FAILED',
        'Authentication failed',
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/compare')
      .send(validComparePayload)
      .expect(400);

    expect(response.body.reason).toBe('AUTH_FAILED');
  });

  it('POST /compare/pdf returns a PDF file', async () => {
    extractMock
      .mockResolvedValueOnce(schema([]))
      .mockResolvedValueOnce(schema([]));

    const response = await request(app.getHttpServer())
      .post('/compare/pdf')
      .send(validComparePayload)
      .expect(201);

    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.body.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('GET /api/docs/openapi.json exposes compare routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs/openapi.json')
      .expect(200);

    expect(response.body.paths).toHaveProperty('/compare');
    expect(response.body.paths).toHaveProperty('/compare/pdf');
  });
});
