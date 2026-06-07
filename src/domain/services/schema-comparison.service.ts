import { SchemaEntity } from '../entities/schema.entity';

export class SchemaComparisonService {
  compare(a: SchemaEntity, b: SchemaEntity) {
    const missingTablesA = a.tables.filter(
      (ta) => !b.tables.find((tb) => tb.name === ta.name),
    );

    const missingTablesB = b.tables.filter(
      (tb) => !a.tables.find((ta) => ta.name === tb.name),
    );

    return {
      missing_in_b: missingTablesA.map((t) => t.name),
      missing_in_a: missingTablesB.map((t) => t.name),
    };
  }
}
