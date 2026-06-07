import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import { SchemaExtractorPort } from '../../../domain/ports/schema-extractor.port';
import { SchemaEntity } from '../../../domain/entities/schema.entity';
import { TableEntity } from '../../../domain/entities/table.entity';
import { ColumnEntity } from '../../../domain/entities/column.entity';

@Injectable()
export class PostgresSchemaExtractor implements SchemaExtractorPort {
  async extract(config: any): Promise<SchemaEntity> {
    const client = new Client(config);
    await client.connect();

    try {
      const tablesRes = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      const tables: TableEntity[] = [];

      for (const t of tablesRes.rows) {
        const columnsRes = await client.query(
          `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
        `,
          [t.table_name],
        );

        const columns = columnsRes.rows.map(
          (c) =>
            new ColumnEntity(
              c.column_name,
              c.data_type,
              c.is_nullable === 'YES',
            ),
        );

        tables.push(new TableEntity(t.table_name, columns));
      }

      return new SchemaEntity(tables);
    } finally {
      await client.end();
    }
  }
}
