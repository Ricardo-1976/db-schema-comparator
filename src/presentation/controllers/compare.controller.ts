import { Controller, Post, Body } from '@nestjs/common';
import { CompareSchemasUseCase } from '../../application/use-cases/compare-schemas.use-case';
import { CompareRequestDto } from '../dtos/compare-request.dto';

@Controller('compare')
export class CompareController {
  constructor(private readonly compareSchemasUseCase: CompareSchemasUseCase) {}

  @Post()
  compare(@Body() dto: CompareRequestDto) {
    return this.compareSchemasUseCase.execute(dto.dbA, dto.dbB);
  }
}
