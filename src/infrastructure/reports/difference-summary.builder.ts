import {
  DifferenceType,
  SchemaComparisonResult,
  SchemaDifference,
} from '../../domain/contracts/schema-comparison-result';
import { DatabaseReportLabel } from '../../domain/contracts/comparison-report.input';
import { formatDifferenceForReport } from './format-difference';

export interface DifferenceCategoryGroup {
  label: string;
  types: DifferenceType[];
  explanation: string;
}

export const DIFFERENCE_CATEGORY_GROUPS: DifferenceCategoryGroup[] = [
  {
    label: 'Tables',
    types: ['TABLE_MISSING'],
    explanation:
      'Tables store data. A missing table may cause application errors when one environment expects a structure the other does not have.',
  },
  {
    label: 'Columns',
    types: ['COLUMN_MISSING', 'COLUMN_TYPE', 'COLUMN_NULLABLE'],
    explanation:
      'Columns define the fields within each table. Differences may affect how data is stored or validated.',
  },
  {
    label: 'Primary Keys',
    types: ['PRIMARY_KEY'],
    explanation:
      'Primary keys uniquely identify each row. Misaligned keys can break data integrity and relationships.',
  },
  {
    label: 'Foreign Keys',
    types: ['FOREIGN_KEY'],
    explanation:
      'Foreign keys link tables together. Different rules may change how related records behave on delete or update.',
  },
  {
    label: 'Indexes',
    types: ['INDEX'],
    explanation:
      'Indexes speed up queries. Missing or different indexes may impact performance but not always application logic.',
  },
  {
    label: 'Constraints',
    types: ['CONSTRAINT'],
    explanation:
      'Constraints enforce business rules (UNIQUE, CHECK). Divergences may allow inconsistent data in one environment.',
  },
];

export type CompatibilityLevel =
  | 'Compatible'
  | 'Partially compatible'
  | 'Incompatible';

export interface DifferenceNarrative {
  introduction: string;
  totalDifferences: number;
  categoryRows: { label: string; count: number }[];
  categoryNotes: string[];
  conclusion: string;
  compatibilityLevel: CompatibilityLevel;
}

export function groupDifferencesByCategory(
  differences: SchemaDifference[],
): Map<string, SchemaDifference[]> {
  const grouped = new Map<string, SchemaDifference[]>();

  for (const group of DIFFERENCE_CATEGORY_GROUPS) {
    grouped.set(
      group.label,
      differences.filter((diff) => group.types.includes(diff.type)),
    );
  }

  return grouped;
}

export function countByCategory(
  differences: SchemaDifference[],
): { label: string; count: number }[] {
  const grouped = groupDifferencesByCategory(differences);

  return DIFFERENCE_CATEGORY_GROUPS.map((group) => ({
    label: group.label,
    count: grouped.get(group.label)?.length ?? 0,
  }));
}

function resolveCompatibilityLevel(
  differences: SchemaDifference[],
): CompatibilityLevel {
  if (differences.length === 0) {
    return 'Compatible';
  }

  const hasCritical = differences.some(
    (diff) =>
      diff.type === 'TABLE_MISSING' ||
      diff.type === 'PRIMARY_KEY' ||
      diff.type === 'FOREIGN_KEY',
  );

  if (hasCritical) {
    return 'Incompatible';
  }

  return 'Partially compatible';
}

function buildCategoryNotes(differences: SchemaDifference[]): string[] {
  const notes: string[] = [];
  const grouped = groupDifferencesByCategory(differences);

  for (const group of DIFFERENCE_CATEGORY_GROUPS) {
    const items = grouped.get(group.label) ?? [];
    if (items.length === 0) {
      continue;
    }

    const examples = items
      .slice(0, 2)
      .map((diff) => formatDifferenceForReport(diff))
      .join('; ');

    const suffix = items.length > 2 ? ` (+${items.length - 2} more)` : '';

    notes.push(
      `${group.label}: ${group.explanation} Found ${items.length} issue(s). Examples: ${examples}${suffix}.`,
    );
  }

  return notes;
}

export function buildDifferenceNarrative(
  result: SchemaComparisonResult,
  configA: DatabaseReportLabel,
  configB: DatabaseReportLabel,
): DifferenceNarrative {
  const { summary, differences } = result;
  const totalDifferences = differences.length;
  const compatibilityLevel = resolveCompatibilityLevel(differences);

  const introduction =
    `This report compares the structural schema of two PostgreSQL databases: ` +
    `Database A (${configA.database} @ ${configA.host}:${configA.port}) and ` +
    `Database B (${configB.database} @ ${configB.host}:${configB.port}). ` +
    `It covers tables, columns, primary keys, foreign keys, indexes, and constraints ` +
    `in the public schema.\n\n` +
    `${summary.tablesCompared} table(s) were compared. ` +
    `${summary.equal} are structurally identical and ${summary.different} ` +
    `have at least one difference. ` +
    `A total of ${totalDifferences} structural divergence(s) were found.`;

  let conclusion: string;

  if (compatibilityLevel === 'Compatible') {
    conclusion =
      'Conclusion: The schemas are compatible. No structural differences were detected. ' +
      'Both databases can be considered aligned at schema level 1.';
  } else if (compatibilityLevel === 'Incompatible') {
    conclusion =
      'Conclusion: The schemas are incompatible. Critical differences (missing tables, ' +
      'primary keys, or foreign keys) were found. Align these structures before promoting ' +
      'changes between environments.';
  } else {
    conclusion =
      'Conclusion: The schemas are partially compatible. Non-critical differences were found. ' +
      'Review column, index, and constraint changes to avoid runtime issues.';
  }

  return {
    introduction,
    totalDifferences,
    categoryRows: countByCategory(differences),
    categoryNotes: buildCategoryNotes(differences),
    conclusion,
    compatibilityLevel,
  };
}
