import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { DatabaseReportLabel } from '../../domain/contracts/comparison-report.input';
import { ComparisonReportInput } from '../../domain/contracts/comparison-report.input';
import { ComparisonReportPort } from '../../domain/ports/comparison-report.port';
import { SchemaDifference } from '../../domain/contracts/schema-comparison-result';
import { TableEntity } from '../../domain/entities/table.entity';
import {
  formatConstraint,
  formatForeignKey,
  formatIndex,
  formatNullable,
  formatPrimaryKey,
} from '../../domain/services/schema-formatters';
import {
  buildDifferenceNarrative,
  groupDifferencesByCategory,
} from './difference-summary.builder';
import { sortDifferences, toDifferenceTableRow } from './difference-table-rows';
import { computeInventoryStats, formatInventoryStats } from './inventory-stats';
import { DIFFERENCE_GROUP_ORDER, PDF_COLORS, PDF_LAYOUT } from './pdf-styles';

type PdfDocument = InstanceType<typeof PDFDocument>;

interface TableColumn {
  label: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

@Injectable()
export class PdfComparisonReportGenerator implements ComparisonReportPort {
  generate(input: ComparisonReportInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: PDF_LAYOUT.margin,
        size: 'A4',
        bufferPages: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderReport(doc, input);
      this.renderFooters(doc);
      doc.end();
    });
  }

  private renderReport(doc: PdfDocument, input: ComparisonReportInput): void {
    const { configA, configB, result, schemaA, schemaB } = input;
    const narrative = buildDifferenceNarrative(result, configA, configB);

    this.renderCover(doc, configA, configB, narrative.compatibilityLevel);
    this.renderSummaryKpis(doc, result.summary, narrative.totalDifferences);
    this.renderNarrativeSummary(doc, narrative);
    this.renderGroupedDifferences(doc, result.differences);
    this.renderSchemaSection(
      doc,
      'Database A — Schema inventory',
      configA,
      schemaA.tables,
    );
    this.renderSchemaSection(
      doc,
      'Database B — Schema inventory',
      configB,
      schemaB.tables,
    );
  }

  private renderCover(
    doc: PdfDocument,
    configA: ComparisonReportInput['configA'],
    configB: ComparisonReportInput['configB'],
    compatibility: string,
  ): void {
    const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor(PDF_COLORS.title)
      .text('Schema Comparison Report', { align: 'center' });

    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(PDF_COLORS.muted)
      .text('PostgreSQL structural comparison (Level 1)', { align: 'center' });

    doc.moveDown(1.2);
    this.drawHorizontalRule(doc);

    doc.moveDown(1);
    doc.fontSize(11).fillColor(PDF_COLORS.body);
    doc.text(`Generated: ${generatedAt} UTC`, { align: 'center' });
    doc.moveDown(0.8);

    doc.text(`Database A: ${configA.database}`, { align: 'center' });
    doc.text(`${configA.host}:${configA.port}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Database B: ${configB.database}`, { align: 'center' });
    doc.text(`${configB.host}:${configB.port}`, { align: 'center' });

    doc.moveDown(1.2);
    const statusColor = this.compatibilityColor(compatibility);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(statusColor)
      .text(`Status: ${compatibility}`, { align: 'center' });

    doc.addPage();
  }

  private renderSummaryKpis(
    doc: PdfDocument,
    summary: ComparisonReportInput['result']['summary'],
    totalDifferences: number,
  ): void {
    this.renderSectionHeader(doc, 'Summary');

    const kpiY = doc.y;
    const colWidth = (doc.page.width - PDF_LAYOUT.margin * 2) / 2 - 8;

    this.renderKpiCard(
      doc,
      PDF_LAYOUT.margin,
      kpiY,
      colWidth,
      'Tables compared',
      String(summary.tablesCompared),
    );
    this.renderKpiCard(
      doc,
      PDF_LAYOUT.margin + colWidth + 16,
      kpiY,
      colWidth,
      'Equal tables',
      String(summary.equal),
    );

    doc.y = kpiY + 58;
    const row2Y = doc.y;

    this.renderKpiCard(
      doc,
      PDF_LAYOUT.margin,
      row2Y,
      colWidth,
      'Different tables',
      String(summary.different),
    );
    this.renderKpiCard(
      doc,
      PDF_LAYOUT.margin + colWidth + 16,
      row2Y,
      colWidth,
      'Total divergences',
      String(totalDifferences),
    );

    doc.y = row2Y + 70;
  }

  private renderNarrativeSummary(
    doc: PdfDocument,
    narrative: ReturnType<typeof buildDifferenceNarrative>,
  ): void {
    this.renderSectionHeader(doc, 'Difference overview');

    this.renderPanel(doc, () => {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(PDF_COLORS.body)
        .text(narrative.introduction, {
          align: 'justify',
          lineGap: 3,
        });

      doc.moveDown(0.8);
      this.renderCategoryTable(doc, narrative.categoryRows);

      if (narrative.categoryNotes.length > 0) {
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fontSize(10).text('What was found:');
        doc.moveDown(0.3);
        doc.font('Helvetica');

        for (const note of narrative.categoryNotes) {
          this.ensureSpace(doc, 36);
          doc.text(`• ${note}`, { lineGap: 2 });
          doc.moveDown(0.3);
        }
      }

      doc.moveDown(0.5);
      doc
        .font('Helvetica-Bold')
        .fillColor(PDF_COLORS.title)
        .text(narrative.conclusion, { lineGap: 2 });
    });

    doc.moveDown(0.8);
  }

  private renderCategoryTable(
    doc: PdfDocument,
    rows: { label: string; count: number }[],
  ): void {
    this.renderDataTable(
      doc,
      [
        { label: 'Category', width: 0.7 },
        { label: 'Count', width: 0.3, align: 'right' },
      ],
      rows.map((row) => [row.label, String(row.count)]),
      22,
    );
  }

  private renderGroupedDifferences(
    doc: PdfDocument,
    differences: SchemaDifference[],
  ): void {
    this.renderSectionHeader(doc, 'Detailed differences');

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(PDF_COLORS.muted)
      .text(
        differences.length === 0
          ? 'No structural divergences were detected.'
          : `${differences.length} divergence(s) grouped by category.`,
      );
    doc.moveDown(0.6);

    if (differences.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(PDF_COLORS.body)
        .text('Both schemas are structurally identical at level 1.');
      doc.moveDown(0.8);
      return;
    }

    const grouped = groupDifferencesByCategory(differences);
    const differenceColumns: TableColumn[] = [
      { label: 'Table', width: 0.2 },
      { label: 'Object', width: 0.28 },
      { label: 'Database A', width: 0.26 },
      { label: 'Database B', width: 0.26 },
    ];

    for (const label of DIFFERENCE_GROUP_ORDER) {
      const items = sortDifferences(grouped.get(label) ?? []);
      if (items.length === 0) {
        continue;
      }

      this.ensureSpace(doc, 70);
      this.renderCategoryBanner(doc, label, items.length);

      const rows = items.map((diff) => {
        const row = toDifferenceTableRow(diff);
        return [row.table, row.object, row.databaseA, row.databaseB];
      });

      this.renderDataTable(doc, differenceColumns, rows, 20);
      doc.moveDown(0.6);
    }
  }

  private renderSchemaSection(
    doc: PdfDocument,
    title: string,
    config: DatabaseReportLabel,
    tables: TableEntity[],
  ): void {
    this.renderSectionHeader(doc, title);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(PDF_COLORS.body)
      .text(`${config.database} @ ${config.host}:${config.port}`);
    doc.moveDown(0.4);

    if (tables.length === 0) {
      doc.font('Helvetica').fontSize(10).text('No tables found.');
      doc.moveDown(0.8);
      return;
    }

    const stats = computeInventoryStats(tables);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(PDF_COLORS.title)
      .text('Summary');
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(PDF_COLORS.body)
      .text(formatInventoryStats(stats));
    doc.moveDown(0.6);

    this.renderTableIndex(doc, tables);
    doc.moveDown(0.4);

    const sorted = [...tables].sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    for (const table of sorted) {
      this.renderTableCard(doc, table);
      doc.moveDown(0.5);
    }
  }

  private renderTableIndex(doc: PdfDocument, tables: TableEntity[]): void {
    this.ensureSpace(doc, 40);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(PDF_COLORS.title)
      .text(`Tables in this database (${tables.length})`);
    doc.moveDown(0.3);

    const sorted = [...tables].sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    doc.font('Helvetica').fontSize(9).fillColor(PDF_COLORS.body);

    for (let index = 0; index < sorted.length; index++) {
      const table = sorted[index];
      this.ensureSpace(doc, 16);
      doc.text(
        `${String(index + 1).padStart(2, ' ')}. ${table.name} (${table.columns.length} columns)`,
      );
    }

    doc.moveDown(0.2);
  }

  private renderTableCard(doc: PdfDocument, table: TableEntity): void {
    const estimatedHeight = this.estimateTableCardHeight(table);
    this.ensureSpace(doc, estimatedHeight);

    const cardX = PDF_LAYOUT.margin;
    const cardWidth = doc.page.width - PDF_LAYOUT.margin * 2;
    const cardStartY = doc.y;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(PDF_COLORS.title)
      .text(`Table: ${table.name}`, cardX + 10, cardStartY + 10);

    doc.y = cardStartY + 30;
    doc.x = cardX + 10;

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(PDF_COLORS.muted)
      .text(`Columns (${table.columns.length})`);
    doc.moveDown(0.2);

    if (table.columns.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(PDF_COLORS.body)
        .text('(none)');
    } else {
      this.renderDataTable(
        doc,
        [
          { label: 'Column', width: 0.34 },
          { label: 'Type', width: 0.42 },
          { label: 'Nullable', width: 0.24 },
        ],
        table.columns.map((column) => [
          column.name,
          column.type,
          formatNullable(column.nullable),
        ]),
        18,
        cardX + 10,
        cardWidth - 20,
      );
    }

    doc.moveDown(0.3);

    if (table.primaryKey) {
      this.renderCardListSection(doc, 'Primary key', [
        `${table.primaryKey.name}: ${formatPrimaryKey(table.primaryKey)}`,
      ]);
    }

    if (table.foreignKeys.length > 0) {
      this.renderCardListSection(
        doc,
        `Foreign keys (${table.foreignKeys.length})`,
        table.foreignKeys.map((fk) => `${fk.name}: ${formatForeignKey(fk)}`),
      );
    }

    if (table.indexes.length > 0) {
      this.renderCardListSection(
        doc,
        `Indexes (${table.indexes.length})`,
        table.indexes.map((index) => `${index.name}: ${formatIndex(index)}`),
      );
    }

    if (table.constraints.length > 0) {
      this.renderCardListSection(
        doc,
        `Constraints (${table.constraints.length})`,
        table.constraints.map(
          (constraint) => `${constraint.name}: ${formatConstraint(constraint)}`,
        ),
      );
    }

    const cardEndY = doc.y + 10;
    doc
      .roundedRect(cardX, cardStartY, cardWidth, cardEndY - cardStartY, 6)
      .lineWidth(1)
      .strokeColor(PDF_COLORS.border)
      .stroke();

    doc.y = cardEndY + 4;
    doc.x = PDF_LAYOUT.margin;
  }

  private renderCardListSection(
    doc: PdfDocument,
    label: string,
    lines: string[],
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(PDF_COLORS.muted)
      .text(label);
    doc.font('Helvetica').fontSize(8).fillColor(PDF_COLORS.body);

    for (const line of lines) {
      this.ensureSpace(doc, 14);
      doc.text(`  • ${line}`);
    }

    doc.moveDown(0.2);
  }

  private estimateTableCardHeight(table: TableEntity): number {
    let height = 56;
    height += 22 + table.columns.length * 18;
    if (table.primaryKey) {
      height += 24;
    }
    height += table.foreignKeys.length * 14;
    height += table.indexes.length * 14;
    height += table.constraints.length * 14;
    return Math.min(height, 420);
  }

  private renderDataTable(
    doc: PdfDocument,
    columns: TableColumn[],
    rows: string[][],
    rowHeight: number,
    startX: number = PDF_LAYOUT.margin,
    tableWidth: number = doc.page.width - PDF_LAYOUT.margin * 2,
  ): void {
    if (rows.length === 0) {
      return;
    }

    const colWidths = columns.map((column) => column.width * tableWidth);
    const headerY = doc.y;

    doc.save();
    doc.rect(startX, headerY, tableWidth, rowHeight).fill(PDF_COLORS.panelBg);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_COLORS.title);
    let offsetX = startX;

    for (let index = 0; index < columns.length; index++) {
      const column = columns[index];
      doc.text(column.label, offsetX + 6, headerY + 6, {
        width: colWidths[index] - 12,
        align: column.align ?? 'left',
      });
      offsetX += colWidths[index];
    }

    doc.y = headerY + rowHeight;
    doc.font('Helvetica').fontSize(8).fillColor(PDF_COLORS.body);

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      this.ensureSpace(doc, rowHeight + 2);
      const rowY = doc.y;
      const row = rows[rowIndex];

      if (rowIndex % 2 === 1) {
        doc.save();
        doc.rect(startX, rowY, tableWidth, rowHeight).fill('#f8fafc');
        doc.restore();
      }

      doc
        .rect(startX, rowY, tableWidth, rowHeight)
        .strokeColor(PDF_COLORS.border)
        .stroke();

      offsetX = startX;
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex];
        doc.text(row[colIndex] ?? '—', offsetX + 6, rowY + 5, {
          width: colWidths[colIndex] - 12,
          align: column.align ?? 'left',
        });
        offsetX += colWidths[colIndex];
      }

      doc.y = rowY + rowHeight;
    }
  }

  private renderCategoryBanner(
    doc: PdfDocument,
    label: string,
    count: number,
  ): void {
    const startX = PDF_LAYOUT.margin;
    const width = doc.page.width - PDF_LAYOUT.margin * 2;
    const bannerY = doc.y;

    doc.save();
    doc.rect(startX, bannerY, width, 24).fill('#e8f0fe');
    doc.restore();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(PDF_COLORS.primary)
      .text(`${label} (${count})`, startX + 8, bannerY + 7);

    doc.y = bannerY + 30;
  }

  private renderSectionHeader(doc: PdfDocument, title: string): void {
    this.ensureSpace(doc, 48);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(PDF_COLORS.primary)
      .text(title);
    doc.moveDown(0.2);
    this.drawHorizontalRule(doc);
    doc.moveDown(0.6);
  }

  private renderKpiCard(
    doc: PdfDocument,
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
  ): void {
    const height = 48;
    doc.rect(x, y, width, height).fill(PDF_COLORS.panelBg);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(PDF_COLORS.muted)
      .text(label, x + 10, y + 10, { width: width - 20 });
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(PDF_COLORS.title)
      .text(value, x + 10, y + 24, { width: width - 20 });
  }

  private renderPanel(doc: PdfDocument, renderContent: () => void): void {
    const x = PDF_LAYOUT.margin;
    const width = doc.page.width - PDF_LAYOUT.margin * 2;
    const startY = doc.y;
    const innerX = x + 12;

    doc.x = innerX;
    doc.y = startY + 10;
    renderContent();
    const endY = doc.y;
    const boxHeight = endY - startY + 20;

    doc.save();
    doc.roundedRect(x, startY, width, boxHeight, 4).fill(PDF_COLORS.panelBg);
    doc.restore();

    doc.x = innerX;
    doc.y = startY + 10;
    renderContent();
    doc.y = startY + boxHeight + 8;
    doc.x = PDF_LAYOUT.margin;
  }

  private drawHorizontalRule(doc: PdfDocument): void {
    const y = doc.y;
    doc
      .moveTo(PDF_LAYOUT.margin, y)
      .lineTo(doc.page.width - PDF_LAYOUT.margin, y)
      .strokeColor(PDF_COLORS.border)
      .stroke();
    doc.moveDown(0.3);
  }

  private compatibilityColor(level: string): string {
    if (level === 'Compatible') {
      return PDF_COLORS.success;
    }
    if (level === 'Incompatible') {
      return PDF_COLORS.danger;
    }
    return PDF_COLORS.warning;
  }

  private renderFooters(doc: PdfDocument): void {
    const range = doc.bufferedPageRange();
    const total = range.count;

    for (let index = 0; index < total; index++) {
      doc.switchToPage(range.start + index);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(PDF_COLORS.muted)
        .text(
          `Schema Comparison Report — Page ${index + 1} of ${total}`,
          PDF_LAYOUT.margin,
          doc.page.height - 35,
          {
            align: 'center',
            width: doc.page.width - PDF_LAYOUT.margin * 2,
          },
        );
    }
  }

  private ensureSpace(doc: PdfDocument, required: number): void {
    const bottom = doc.page.height - doc.page.margins.bottom - 40;

    if (doc.y + required > bottom) {
      doc.addPage();
      doc.x = PDF_LAYOUT.margin;
    }
  }
}
