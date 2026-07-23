import { SchemaComparisonService } from './schema-comparison.service';
import {
  column,
  schema,
  table,
} from '../../test/helpers/schema.factory';
import { ConstraintEntity } from '../entities/constraint.entity';
import { ForeignKeyEntity } from '../entities/foreign-key.entity';
import { IndexEntity } from '../entities/index.entity';
import { PrimaryKeyEntity } from '../entities/primary-key.entity';

describe('SchemaComparisonService', () => {
  const service = new SchemaComparisonService();

  it('returns no differences for identical schemas', () => {
    const source = schema([
      table('users', [column('id', 'INTEGER', false)]),
    ]);
    const target = schema([
      table('users', [column('id', 'INTEGER', false)]),
    ]);

    const result = service.compare(source, target);

    expect(result.summary).toEqual({
      tablesCompared: 1,
      equal: 1,
      different: 0,
    });
    expect(result.differences).toEqual([]);
  });

  it('detects TABLE_MISSING in Database A', () => {
    const source = schema([table('users', [column('id', 'INTEGER', false)])]);
    const target = schema([]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'TABLE_MISSING',
      existsIn: 'Database A',
    });
  });

  it('detects TABLE_MISSING in Database B', () => {
    const source = schema([]);
    const target = schema([table('invoice', [column('id', 'INTEGER', false)])]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'invoice',
      type: 'TABLE_MISSING',
      existsIn: 'Database B',
    });
  });

  it('detects COLUMN_TYPE difference', () => {
    const source = schema([
      table('customer', [column('name', 'VARCHAR(100)', true)]),
    ]);
    const target = schema([
      table('customer', [column('name', 'VARCHAR(255)', true)]),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'customer',
      type: 'COLUMN_TYPE',
      column: 'name',
      databaseA: 'VARCHAR(100)',
      databaseB: 'VARCHAR(255)',
    });
  });

  it('detects COLUMN_NULLABLE difference', () => {
    const source = schema([
      table('users', [column('email', 'TEXT', false)]),
    ]);
    const target = schema([
      table('users', [column('email', 'TEXT', true)]),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'COLUMN_NULLABLE',
      column: 'email',
      databaseA: 'NOT NULL',
      databaseB: 'NULL',
    });
  });

  it('detects COLUMN_MISSING on both sides', () => {
    const source = schema([
      table('users', [
        column('id', 'INTEGER', false),
        column('phone', 'TEXT', true),
      ]),
    ]);
    const target = schema([
      table('users', [
        column('id', 'INTEGER', false),
        column('email', 'TEXT', true),
      ]),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'COLUMN_MISSING',
      column: 'phone',
      existsIn: 'Database A',
    });
    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'COLUMN_MISSING',
      column: 'email',
      existsIn: 'Database B',
    });
  });

  it('detects PRIMARY_KEY missing in Database B', () => {
    const source = schema([
      table('users', [column('id', 'INTEGER', false)], {
        primaryKey: new PrimaryKeyEntity('users_pkey', ['id']),
      }),
    ]);
    const target = schema([table('users', [column('id', 'INTEGER', false)])]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'PRIMARY_KEY',
      constraint: 'users_pkey',
      existsIn: 'Database A',
    });
  });

  it('detects PRIMARY_KEY with different columns', () => {
    const source = schema([
      table('users', [column('id', 'INTEGER', false)], {
        primaryKey: new PrimaryKeyEntity('users_pkey', ['id']),
      }),
    ]);
    const target = schema([
      table('users', [
        column('id', 'INTEGER', false),
        column('tenant_id', 'INTEGER', false),
      ], {
        primaryKey: new PrimaryKeyEntity('users_pkey', ['id', 'tenant_id']),
      }),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'PRIMARY_KEY',
      constraint: 'users_pkey',
      databaseA: '(id)',
      databaseB: '(id, tenant_id)',
    });
  });

  it('detects FOREIGN_KEY rule difference', () => {
    const source = schema([
      table('orders', [column('user_id', 'INTEGER', false)], {
        foreignKeys: [
          new ForeignKeyEntity(
            'fk_orders_user',
            ['user_id'],
            'users',
            ['id'],
            'CASCADE',
            'NO ACTION',
          ),
        ],
      }),
    ]);
    const target = schema([
      table('orders', [column('user_id', 'INTEGER', false)], {
        foreignKeys: [
          new ForeignKeyEntity(
            'fk_orders_user',
            ['user_id'],
            'users',
            ['id'],
            'RESTRICT',
            'NO ACTION',
          ),
        ],
      }),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: 'orders',
          type: 'FOREIGN_KEY',
          constraint: 'fk_orders_user',
        }),
      ]),
    );
  });

  it('detects INDEX difference', () => {
    const source = schema([
      table('users', [column('email', 'TEXT', true)], {
        indexes: [
          new IndexEntity('idx_users_email', ['email'], true, 'btree'),
        ],
      }),
    ]);
    const target = schema([
      table('users', [column('email', 'TEXT', true)], {
        indexes: [
          new IndexEntity('idx_users_email', ['email'], false, 'btree'),
        ],
      }),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'users',
      type: 'INDEX',
      constraint: 'idx_users_email',
      databaseA: 'UNIQUE btree (email)',
      databaseB: 'btree (email)',
    });
  });

  it('detects CONSTRAINT difference', () => {
    const source = schema([
      table('products', [column('price', 'NUMERIC(10,2)', false)], {
        constraints: [
          new ConstraintEntity(
            'products_price_check',
            'CHECK',
            [],
            '((price > 0))',
          ),
        ],
      }),
    ]);
    const target = schema([
      table('products', [column('price', 'NUMERIC(10,2)', false)], {
        constraints: [
          new ConstraintEntity(
            'products_price_check',
            'CHECK',
            [],
            '((price >= 0))',
          ),
        ],
      }),
    ]);

    const result = service.compare(source, target);

    expect(result.differences).toContainEqual({
      table: 'products',
      type: 'CONSTRAINT',
      constraint: 'products_price_check',
      databaseA: 'CHECK ((price > 0))',
      databaseB: 'CHECK ((price >= 0))',
    });
  });

  it('calculates summary correctly', () => {
    const source = schema([
      table('users', [column('id', 'INTEGER', false)]),
      table('orders', [column('id', 'INTEGER', false)]),
    ]);
    const target = schema([
      table('users', [column('id', 'BIGINT', false)]),
      table('invoice', [column('id', 'INTEGER', false)]),
    ]);

    const result = service.compare(source, target);

    expect(result.summary.tablesCompared).toBe(3);
    expect(result.summary.equal + result.summary.different).toBe(3);
    expect(result.summary.different).toBeGreaterThan(0);
  });
});
