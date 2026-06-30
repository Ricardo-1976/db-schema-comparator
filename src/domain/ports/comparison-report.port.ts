import { ComparisonReportInput } from '../contracts/comparison-report.input';

export const COMPARISON_REPORT_GENERATOR = Symbol(
  'COMPARISON_REPORT_GENERATOR',
);

export interface ComparisonReportPort {
  generate(input: ComparisonReportInput): Promise<Buffer>;
}
