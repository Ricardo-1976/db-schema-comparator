import { Body, Controller, Header, Post, StreamableFile } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CompareSchemasUseCase } from '../../application/use-cases/compare-schemas.use-case';
import { GenerateComparisonPdfUseCase } from '../../application/use-cases/generate-comparison-pdf.use-case';
import { CompareRequestDto } from '../dtos/compare-request.dto';
import { DatabaseConnectionErrorDto } from '../dtos/database-connection-error.dto';
import { SchemaComparisonResultDto } from '../dtos/schema-comparison-result.dto';

@ApiTags('compare')
@Controller('compare')
export class CompareController {
  constructor(
    private readonly compareSchemasUseCase: CompareSchemasUseCase,
    private readonly generateComparisonPdfUseCase: GenerateComparisonPdfUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Comparar schemas (JSON)',
    description:
      'Extrai o schema public de dois bancos PostgreSQL e devolve summary + lista de diferenças.',
  })
  @ApiOkResponse({
    description: 'Comparação concluída com sucesso',
    type: SchemaComparisonResultDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido ou erro de autenticação/database',
    type: DatabaseConnectionErrorDto,
  })
  @ApiBadGatewayResponse({
    description: 'Host inacessível ou timeout de conexão',
    type: DatabaseConnectionErrorDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Erro de conexão desconhecido',
    type: DatabaseConnectionErrorDto,
  })
  compare(@Body() dto: CompareRequestDto) {
    return this.compareSchemasUseCase.execute(dto.dbA, dto.dbB);
  }

  @Post('pdf')
  @ApiOperation({
    summary: 'Comparar schemas (PDF)',
    description:
      'Mesma comparação de POST /compare, com relatório PDF para download.',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Relatório PDF gerado',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiBadRequestResponse({ type: DatabaseConnectionErrorDto })
  @ApiBadGatewayResponse({ type: DatabaseConnectionErrorDto })
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
