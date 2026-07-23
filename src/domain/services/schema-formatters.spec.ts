import { ConstraintEntity } from '../entities/constraint.entity';
import { ForeignKeyEntity } from '../entities/foreign-key.entity';
import { IndexEntity } from '../entities/index.entity';
import { PrimaryKeyEntity } from '../entities/primary-key.entity';
import {
  formatConstraint,
  formatForeignKey,
  formatIndex,
  formatNullable,
  formatPrimaryKey,
} from './schema-formatters';

describe('schema-formatters', () => {
  it('formatPrimaryKey joins columns', () => {
    expect(formatPrimaryKey(new PrimaryKeyEntity('pk', ['id', 'tenant_id']))).toBe(
      '(id, tenant_id)',
    );
  });

  it('formatForeignKey includes rules', () => {
    const fk = new ForeignKeyEntity(
      'fk',
      ['user_id'],
      'users',
      ['id'],
      'CASCADE',
      'NO ACTION',
    );

    expect(formatForeignKey(fk)).toBe(
      'user_id → users(id) ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  });

  it('formatIndex marks unique indexes', () => {
    expect(
      formatIndex(new IndexEntity('idx', ['email'], true, 'btree')),
    ).toBe('UNIQUE btree (email)');
    expect(
      formatIndex(new IndexEntity('idx', ['email'], false, 'btree')),
    ).toBe('btree (email)');
  });

  it('formatConstraint handles UNIQUE and CHECK', () => {
    expect(
      formatConstraint(
        new ConstraintEntity('uq', 'UNIQUE', ['email'], null),
      ),
    ).toBe('UNIQUE (email)');
    expect(
      formatConstraint(
        new ConstraintEntity('chk', 'CHECK', [], '((price > 0))'),
      ),
    ).toBe('CHECK ((price > 0))');
  });

  it('formatNullable returns NULL or NOT NULL', () => {
    expect(formatNullable(true)).toBe('NULL');
    expect(formatNullable(false)).toBe('NOT NULL');
  });
});
