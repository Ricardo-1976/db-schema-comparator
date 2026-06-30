import { Body, Controller, Header, Post, StreamableFile } from '@nestjs/common';
import { CompareSchemasUseCase } from '../../application/use-cases/compare-schemas.use-case';
import { GenerateComparisonPdfUseCase } from '../../application/use-cases/generate-comparison-pdf.use-case';
import { CompareRequestDto } from '../dtos/compare-request.dto';

@Controller('compare')
export class CompareController {
  constructor(
    private readonly compareSchemasUseCase: CompareSchemasUseCase,
    private readonly generateComparisonPdfUseCase: GenerateComparisonPdfUseCase,
  ) {}

  @Post()
  compare(@Body() dto: CompareRequestDto) {
    return this.compareSchemasUseCase.execute(dto.dbA, dto.dbB);
  }

  @Post('pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="schema-comparison.pdf"')
  async comparePdf(@Body() dto: CompareRequestDto) {
    const pdf = await this.generateComparisonPdfUseCase.execute(
      dto.dbA,
      dto.dbB,
    );

    return new StreamableFile(pdf);
  }
}
