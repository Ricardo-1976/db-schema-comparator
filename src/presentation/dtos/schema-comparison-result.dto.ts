import { ApiProperty } from '@nestjs/swagger';

export class SchemaComparisonSummaryDto {
  @ApiProperty({ example: 52 })
  tablesCompared: number;

  @ApiProperty({ example: 46 })
  equal: number;

  @ApiProperty({ example: 6 })
  different: number;
}

export class SchemaDifferenceDto {
  @ApiProperty({ example: 'users' })
  table: string;

  @ApiProperty({
    example: 'COLUMN_TYPE',
    enum: [
      'TABLE_MISSING',
      'COLUMN_MISSING',
      'COLUMN_TYPE',
      'COLUMN_NULLABLE',
      'PRIMARY_KEY',
      'FOREIGN_KEY',
      'INDEX',
      'CONSTRAINT',
    ],
  })
  type: string;

  @ApiProperty({ required: false, example: 'name' })
  column?: string;

  @ApiProperty({ required: false, example: 'users_pkey' })
  constraint?: string;

  @ApiProperty({ required: false, example: 'Database A' })
  existsIn?: string;

  @ApiProperty({ required: false, example: 'VARCHAR(100)' })
  databaseA?: string;

  @ApiProperty({ required: false, example: 'VARCHAR(255)' })
  databaseB?: string;
}

export class SchemaComparisonResultDto {
  @ApiProperty({ type: SchemaComparisonSummaryDto })
  summary: SchemaComparisonSummaryDto;

  @ApiProperty({ type: [SchemaDifferenceDto] })
  differences: SchemaDifferenceDto[];
}
