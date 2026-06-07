import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { DatabaseConfigDto } from './database-config.dto';

export class CompareRequestDto {
  @ValidateNested()
  @Type(() => DatabaseConfigDto)
  dbA: DatabaseConfigDto;

  @ValidateNested()
  @Type(() => DatabaseConfigDto)
  dbB: DatabaseConfigDto;
}
