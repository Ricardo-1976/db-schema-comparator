import { Injectable } from '@nestjs/common';
import { Client } from 'pg';

import { SchemaExtractorPort } from '../../../domain/ports/schema-extractor.port';
import { SchemaEntity } from '../../../domain/entities/schema.entity';
import { TableEntity } from '../../../domain/entities/table.entity';
import { ColumnEntity } from '../../../domain/entities/column.entity';
import { DatabaseConfig } from '../../../shared/interfaces/database-config.interface';

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
}

@Injectable()
export class PostgresSchemaExtractor implements SchemaExtractorPort {
  async extract(config: DatabaseConfig): Promise<SchemaEntity> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const client = new Client(config);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await client.connect();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const tablesRes = await client.query<TableRow>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);

      const tables: TableEntity[] = [];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      for (const table of tablesRes.rows) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const columnsRes = await client.query<ColumnRow>(
          `
          SELECT
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          `,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          [table.table_name],
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const columns: ColumnEntity[] = columnsRes.rows.map(
          (column: {
            column_name: string;
            data_type: string;
            is_nullable: string;
          }) =>
            new ColumnEntity(
              column.column_name,
              column.data_type,
              column.is_nullable === 'YES',
            ),
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        tables.push(new TableEntity(table.table_name, columns));
      }

      return new SchemaEntity(tables);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await client.end();
    }
  }
}
