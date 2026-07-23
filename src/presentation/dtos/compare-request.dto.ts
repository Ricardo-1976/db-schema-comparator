import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { DatabaseConfigDto } from './database-config.dto';

export class CompareRequestDto {
  @ApiProperty({ type: DatabaseConfigDto, description: 'Database A (source)' })
  @ValidateNested()
  @Type(() => DatabaseConfigDto)
  dbA: DatabaseConfigDto;

  @ApiProperty({ type: DatabaseConfigDto, description: 'Database B (target)' })
  @ValidateNested()
  @Type(() => DatabaseConfigDto)
  dbB: DatabaseConfigDto;
}
